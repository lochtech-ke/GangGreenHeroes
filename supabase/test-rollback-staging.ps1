# Test Rollback Script for Migration 032 on Staging
# Description: Automates the rollback testing process
# Requirements: B6.1, B6.2, B6.3
# Date: 2025-01-30

param(
    [switch]$SaveOutput,
    [switch]$SkipConfirmation
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Header { 
    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor Magenta
    Write-Host $args -ForegroundColor Magenta
    Write-Host "========================================================================" -ForegroundColor Magenta
    Write-Host ""
}

# Script start
Write-Header "ROLLBACK TEST FOR MIGRATION 032"
Write-Info "Environment: STAGING"
Write-Info "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""

# Check if Supabase CLI is installed
Write-Info "Checking prerequisites..."
try {
    $supabaseVersion = npx supabase --version 2>&1
    Write-Success "✓ Supabase CLI found: $supabaseVersion"
} catch {
    Write-Error "✗ Supabase CLI not found. Please install it first."
    Write-Info "  Run: npm install -g supabase"
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "supabase/migrations")) {
    Write-Error "✗ Not in project root directory"
    Write-Info "  Please run this script from the project root"
    exit 1
}
Write-Success "✓ Project structure verified"

# Check if migration 032 exists
if (-not (Test-Path "supabase/migrations/032_consolidate_coins.sql")) {
    Write-Error "✗ Migration 032 not found"
    exit 1
}
Write-Success "✓ Migration 032 found"

# Check if rollback script exists
if (-not (Test-Path "supabase/migrations/rollback_032.sql")) {
    Write-Error "✗ Rollback script not found"
    exit 1
}
Write-Success "✓ Rollback script found"

# Check if test script exists
if (-not (Test-Path "supabase/migrations/test_rollback_032_staging.sql")) {
    Write-Error "✗ Test script not found"
    exit 1
}
Write-Success "✓ Test script found"

Write-Host ""

# Confirmation prompt
if (-not $SkipConfirmation) {
    Write-Warning "⚠ WARNING: This will test the rollback procedure on STAGING"
    Write-Warning "⚠ This involves:"
    Write-Warning "  1. Capturing current state"
    Write-Warning "  2. Executing rollback script"
    Write-Warning "  3. Verifying rollback success"
    Write-Warning "  4. Testing performance"
    Write-Host ""
    $confirmation = Read-Host "Do you want to proceed? (yes/no)"
    
    if ($confirmation -ne "yes") {
        Write-Info "Rollback test cancelled"
        exit 0
    }
}

Write-Host ""
Write-Header "STEP 1: PRE-ROLLBACK STATE CAPTURE"

Write-Info "Capturing current state before rollback..."
try {
    $preState = npx supabase db execute -c @"
SELECT 
    'deprecated_wallets' as metric,
    COUNT(*)::TEXT as value
FROM _deprecated_green_coin_wallets
UNION ALL
SELECT 
    'deprecated_balance',
    COALESCE(SUM(balance), 0)::TEXT
FROM _deprecated_green_coin_wallets
UNION ALL
SELECT 
    'migrated_transactions',
    COUNT(*)::TEXT
FROM gg_coin_transactions
WHERE metadata->>'migrated_from' = 'green_coins';
"@
    
    Write-Success "✓ Pre-rollback state captured"
    Write-Host $preState
} catch {
    Write-Error "✗ Failed to capture pre-rollback state"
    Write-Error $_.Exception.Message
    exit 1
}

Write-Host ""
Write-Header "STEP 2: EXECUTE ROLLBACK"

Write-Warning "⚠ Executing rollback script..."
Write-Info "This will:"
Write-Info "  - Restore Green Coin tables"
Write-Info "  - Remove migrated transactions"
Write-Info "  - Clean up helper functions"
Write-Host ""

$rollbackConfirm = Read-Host "Proceed with rollback? (yes/no)"
if ($rollbackConfirm -ne "yes") {
    Write-Info "Rollback cancelled"
    exit 0
}

try {
    $rollbackStart = Get-Date
    
    Write-Info "Running rollback script..."
    $rollbackOutput = npx supabase db execute -f supabase/migrations/rollback_032.sql 2>&1
    
    $rollbackEnd = Get-Date
    $rollbackDuration = ($rollbackEnd - $rollbackStart).TotalSeconds
    
    Write-Success "✓ Rollback script executed"
    Write-Info "Duration: $([math]::Round($rollbackDuration, 2)) seconds"
    
    if ($SaveOutput) {
        $rollbackOutput | Out-File "supabase/rollback_output_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
        Write-Info "Output saved to rollback_output_*.txt"
    }
    
    # Display rollback output
    Write-Host ""
    Write-Info "Rollback Output:"
    Write-Host $rollbackOutput
    
} catch {
    Write-Error "✗ Rollback script failed"
    Write-Error $_.Exception.Message
    Write-Host ""
    Write-Warning "⚠ Rollback may have partially completed"
    Write-Warning "⚠ Manual intervention may be required"
    exit 1
}

Write-Host ""
Write-Header "STEP 3: VERIFY ROLLBACK SUCCESS"

Write-Info "Running verification tests..."
try {
    $testStart = Get-Date
    
    $testOutput = npx supabase db execute -f supabase/migrations/test_rollback_032_staging.sql 2>&1
    
    $testEnd = Get-Date
    $testDuration = ($testEnd - $testStart).TotalSeconds
    
    Write-Success "✓ Verification tests completed"
    Write-Info "Duration: $([math]::Round($testDuration, 2)) seconds"
    
    if ($SaveOutput) {
        $testOutput | Out-File "supabase/rollback_test_output_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
        Write-Info "Output saved to rollback_test_output_*.txt"
    }
    
    # Display test output
    Write-Host ""
    Write-Info "Test Output:"
    Write-Host $testOutput
    
    # Check for failures in output
    if ($testOutput -match "FAIL") {
        Write-Warning "⚠ Some verification checks failed"
        Write-Warning "⚠ Review the output above for details"
        $hasFailures = $true
    } else {
        Write-Success "✓ All verification checks passed"
        $hasFailures = $false
    }
    
} catch {
    Write-Error "✗ Verification tests failed"
    Write-Error $_.Exception.Message
    exit 1
}

Write-Host ""
Write-Header "STEP 4: POST-ROLLBACK STATE VERIFICATION"

Write-Info "Checking post-rollback state..."
try {
    $postState = npx supabase db execute -c @"
SELECT 
    'green_wallets' as metric,
    COUNT(*)::TEXT as value
FROM green_coin_wallets
UNION ALL
SELECT 
    'green_balance',
    COALESCE(SUM(balance), 0)::TEXT
FROM green_coin_wallets
UNION ALL
SELECT 
    'green_transactions',
    COUNT(*)::TEXT
FROM green_coin_transactions
UNION ALL
SELECT 
    'remaining_migrated_tx',
    COUNT(*)::TEXT
FROM gg_coin_transactions
WHERE metadata->>'migrated_from' = 'green_coins';
"@
    
    Write-Success "✓ Post-rollback state captured"
    Write-Host $postState
} catch {
    Write-Error "✗ Failed to capture post-rollback state"
    Write-Error $_.Exception.Message
}

Write-Host ""
Write-Header "STEP 5: APPLICATION TESTING GUIDANCE"

Write-Info "Database rollback complete. Now test the application:"
Write-Host ""
Write-Info "1. Balance Display (2 min)"
Write-Info "   - Open user profile"
Write-Info "   - Verify Green Coin balance shows"
Write-Info "   - Check formatting"
Write-Host ""
Write-Info "2. Earn Coins (3 min)"
Write-Info "   - Plant a tree or complete action"
Write-Info "   - Verify Green Coins credited"
Write-Info "   - Check toast notification"
Write-Host ""
Write-Info "3. Transaction History (2 min)"
Write-Info "   - View Green Coin history"
Write-Info "   - Check pagination"
Write-Info "   - Verify amounts"
Write-Host ""
Write-Info "4. Service Integration (3 min)"
Write-Info "   - Test greenCoin.service.ts methods"
Write-Info "   - Verify database operations"
Write-Info "   - Check error handling"
Write-Host ""

Write-Host ""
Write-Header "ROLLBACK TEST SUMMARY"

$totalDuration = ($testEnd - $rollbackStart).TotalSeconds

Write-Info "Test Duration: $([math]::Round($totalDuration, 2)) seconds"
Write-Host ""

if ($hasFailures) {
    Write-Warning "⚠ ROLLBACK TEST COMPLETED WITH WARNINGS"
    Write-Warning "Some verification checks failed - review output above"
    Write-Host ""
    Write-Info "Next Steps:"
    Write-Info "  1. Review failed checks in detail"
    Write-Info "  2. Investigate root causes"
    Write-Info "  3. Fix rollback script if needed"
    Write-Info "  4. Re-test rollback procedure"
    Write-Info "  5. Document issues and resolutions"
} else {
    Write-Success "✓ ROLLBACK TEST PASSED"
    Write-Success "All verification checks passed successfully"
    Write-Host ""
    Write-Info "Next Steps:"
    Write-Info "  1. Test application functionality"
    Write-Info "  2. Document rollback test success"
    Write-Info "  3. Re-apply migration 032 if needed"
    Write-Info "  4. Verify migration success"
    Write-Info "  5. Proceed with production planning"
}

Write-Host ""
Write-Header "TEST COMPLETE"

# Save summary if requested
if ($SaveOutput) {
    $summary = @"
Rollback Test Summary
=====================
Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Environment: STAGING
Duration: $([math]::Round($totalDuration, 2)) seconds
Result: $(if ($hasFailures) { "WARNINGS" } else { "PASSED" })

Pre-Rollback State:
$preState

Post-Rollback State:
$postState

Next Steps:
$(if ($hasFailures) {
    "- Review failed checks
- Investigate root causes
- Fix rollback script
- Re-test procedure"
} else {
    "- Test application
- Document success
- Re-apply migration
- Proceed to production"
})
"@
    
    $summary | Out-File "supabase/rollback_test_summary_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
    Write-Info "Summary saved to rollback_test_summary_*.txt"
}

Write-Host ""
