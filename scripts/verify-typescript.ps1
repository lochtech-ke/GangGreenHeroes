# TypeScript Error Verification Script
# Captures TypeScript compilation errors and provides summary

param(
    [string]$OutputFile = "tsc-errors.txt"
)

Write-Host "Running TypeScript compilation check..." -ForegroundColor Cyan

# Run tsc and capture output
$tscOutput = npx tsc --noEmit 2>&1 | Out-String

# Save to file
$tscOutput | Out-File -FilePath $OutputFile -Encoding utf8

# Count errors
$errorCount = ($tscOutput | Select-String -Pattern "error TS\d+" -AllMatches).Matches.Count

# Display summary
Write-Host "`n=== TypeScript Compilation Summary ===" -ForegroundColor Yellow
Write-Host "Total Errors: $errorCount" -ForegroundColor $(if ($errorCount -eq 0) { "Green" } else { "Red" })
Write-Host "Output saved to: $OutputFile" -ForegroundColor Cyan

# Group errors by type
$errorTypes = @{}
$tscOutput | Select-String -Pattern "error (TS\d+):" -AllMatches | ForEach-Object {
    $_.Matches | ForEach-Object {
        $errorCode = $_.Groups[1].Value
        if ($errorTypes.ContainsKey($errorCode)) {
            $errorTypes[$errorCode]++
        } else {
            $errorTypes[$errorCode] = 1
        }
    }
}

if ($errorTypes.Count -gt 0) {
    Write-Host "`nErrors by Type:" -ForegroundColor Yellow
    $errorTypes.GetEnumerator() | Sort-Object -Property Value -Descending | ForEach-Object {
        Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor White
    }
}

Write-Host "`n" -NoNewline

exit $errorCount
