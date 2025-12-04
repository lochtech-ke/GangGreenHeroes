# Deploy Migration 021: Contributor Token Distribution System
# This script helps deploy the contributor token distribution migration

Write-Host "🚀 Deploying Migration 021: Contributor Token Distribution System" -ForegroundColor Green
Write-Host ""

# Check if Supabase CLI is available
if (Get-Command "supabase" -ErrorAction SilentlyContinue) {
    Write-Host "✅ Supabase CLI found" -ForegroundColor Green
    
    # Check if project is linked
    $projectStatus = supabase status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Project linked successfully" -ForegroundColor Green
        
        # Apply migration
        Write-Host "📦 Applying migration 021..." -ForegroundColor Yellow
        supabase db push
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Migration 021 applied successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🔍 Running verification checks..." -ForegroundColor Yellow
            
            # Run verification queries
            $verificationSQL = @"
-- Check tables created
SELECT 'Tables created: ' || COUNT(*) as result
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%github%' 
     OR table_name LIKE '%distribution%' 
     OR table_name LIKE '%contribution%' 
     OR table_name LIKE '%feature_suggestion%' 
     OR table_name LIKE '%contributor_badge%');

-- Check seed data
SELECT 'Contributor badges: ' || COUNT(*) as result FROM contributor_badges
UNION ALL
SELECT 'Feature suggestions: ' || COUNT(*) as result FROM feature_suggestions
UNION ALL
SELECT 'Distribution configs: ' || COUNT(*) as result FROM distribution_config;
"@
            
            Write-Host "📊 Verification results:" -ForegroundColor Cyan
            Write-Host "Run the following SQL in Supabase Dashboard to verify:" -ForegroundColor Yellow
            Write-Host $verificationSQL -ForegroundColor Gray
            
        } else {
            Write-Host "❌ Migration failed. Check the error messages above." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ Project not linked. Run 'supabase link --project-ref wobpryllvdjaapzjbsxx'" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠️  Supabase CLI not found. Using manual deployment method..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Manual Deployment Steps:" -ForegroundColor Cyan
    Write-Host "1. Open Supabase Dashboard: https://app.supabase.com" -ForegroundColor White
    Write-Host "2. Navigate to SQL Editor" -ForegroundColor White
    Write-Host "3. Copy content from: supabase/migrations/021_add_contributor_token_distribution.sql" -ForegroundColor White
    Write-Host "4. Execute the migration" -ForegroundColor White
    Write-Host "5. Verify using queries in: supabase/migrations/DEPLOY_021_GUIDE.md" -ForegroundColor White
}

Write-Host ""
Write-Host "📚 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Implement GitHub API integration service (Task 2)" -ForegroundColor White
Write-Host "2. Create TypeScript type definitions (Task 9)" -ForegroundColor White
Write-Host "3. Build contributor dashboard UI (Task 11)" -ForegroundColor White
Write-Host ""
Write-Host "📖 See DEPLOY_021_GUIDE.md for detailed instructions" -ForegroundColor Yellow