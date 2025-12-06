# Google OAuth Redirect Fix

## Problem
When signing in with Google from production URL (https://gg.lochtech.africa), users were being redirected to http://localhost:3000/ instead of staying on the production domain.

## Root Cause
Supabase OAuth requires explicit configuration of allowed redirect URLs in the dashboard. The production URL was not added to the allowed list.

## Solution

### 1. Configure Supabase Dashboard (REQUIRED)

Go to your Supabase Dashboard and update the authentication settings:

1. Navigate to: https://supabase.com/dashboard/project/wobpryllvdjaapzjbsxx
2. Go to **Authentication** → **URL Configuration**
3. Update **Site URL** to:
   ```
   https://gg.lochtech.africa
   ```
4. Add these URLs to **Redirect URLs** (one per line):
   ```
   https://gg.lochtech.africa/auth/callback
   https://gg.lochtech.africa
   http://localhost:3000/auth/callback
   http://localhost:3000
   ```

### 2. Code Changes (COMPLETED)

The following changes have been made to support environment-based redirect URLs:

#### Added Environment Variable
- `.env` and `.env.example` now include `VITE_APP_URL=https://gg.lochtech.africa`
- This allows the app to use the correct production URL for OAuth redirects

#### Updated Auth Service
- `src/services/auth.service.ts` now uses `VITE_APP_URL` for OAuth redirects
- Falls back to `window.location.origin` if not set (for local development)
- Applied to both Google OAuth and password reset flows

### 3. Deployment

After updating the Supabase dashboard settings:

1. Commit and push the code changes
2. Redeploy to Vercel (should happen automatically)
3. Test Google OAuth sign-in from https://gg.lochtech.africa

## Testing

1. Go to https://gg.lochtech.africa
2. Click "Sign in with Google"
3. Complete Google authentication
4. Verify you're redirected back to https://gg.lochtech.africa/auth/callback
5. Verify you're logged in successfully

## Notes

- The `VITE_APP_URL` environment variable should be set in Vercel's environment variables as well
- For local development, you can omit `VITE_APP_URL` and it will use `http://localhost:3000`
- Make sure both HTTP and HTTPS variants are in the Supabase redirect URLs if needed
