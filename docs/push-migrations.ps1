# GangGreen Platform - Database Migration Script (PowerShell)
# This script helps push migrations to Supabase

Write-Host "🌳 GangGreen Platform - Database Migration" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Check if Supabase CLI is installed
try {
    $version = npx supabase --version 2>$null
    Write-Host "✅ Supabase CLI found (version: $version)" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Installing..." -ForegroundColor Red
    npm install -g supabase
}

Write-Host ""

# Check if project is linked
if (-not (Test-Path ".supabase/config.toml")) {
    Write-Host "🔗 Linking to Supabase project..." -ForegroundColor Yellow
    Write-Host "Please authenticate when prompted." -ForegroundColor Yellow
    Write-Host ""
    
    # Login to Supabase
    Write-Host "Step 1: Logging in to Supabase..." -ForegroundColor Cyan
    npx supabase login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ Login failed." -ForegroundColor Red
        Write-Host ""
        Write-Host "📝 Manual Setup Instructions:" -ForegroundColor Yellow
        Write-Host "1. Run: npx supabase login" -ForegroundColor White
        Write-Host "2. Run: npx supabase link --project-ref wobpryllvdjaapzjbsxx" -ForegroundColor White
        Write-Host "3. Run this script again" -ForegroundColor White
        exit 1
    }
    
    # Link to project
    Write-Host ""
    Write-Host "Step 2: Linking to project..." -ForegroundColor Cyan
    npx supabase link --project-ref wobpryllvdjaapzjbsxx
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ Failed to link project." -ForegroundColor Red
        Write-Host ""
        Write-Host "📝 Manual Setup Instructions:" -ForegroundColor Yellow
        Write-Host "1. Run: npx supabase login" -ForegroundColor White
        Write-Host "2. Run: npx supabase link --project-ref wobpryllvdjaapzjbsxx" -ForegroundColor White
        Write-Host "3. Run this script again" -ForegroundColor White
        exit 1
    }
}

Write-Host "✅ Project linked" -ForegroundColor Green
Write-Host ""

# Push migrations
Write-Host "📤 Pushing migrations to Supabase..." -ForegroundColor Cyan
Write-Host ""

npx supabase db push

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migrations pushed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Database setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Verify tables in Supabase Dashboard" -ForegroundColor White
    Write-Host "2. Set up storage buckets (see supabase/storage/README.md)" -ForegroundColor White
    Write-Host "3. Proceed to Task 3: Authentication System" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Migration failed." -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Alternative: Use Supabase Dashboard" -ForegroundColor Yellow
    Write-Host "1. Go to https://app.supabase.com" -ForegroundColor White
    Write-Host "2. Open SQL Editor" -ForegroundColor White
    Write-Host "3. Execute: supabase/migrations/000_all_migrations.sql" -ForegroundColor White
    Write-Host "4. Execute: supabase/migrations/010_rls_policies.sql" -ForegroundColor White
    Write-Host "5. Execute: supabase/storage/buckets.sql" -ForegroundColor White
    exit 1
}
