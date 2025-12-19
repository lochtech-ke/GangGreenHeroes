# Google OAuth Testing Guide

## Setup Status ✅

The Google OAuth integration is now ready to test! Here's what's been implemented:

### 1. Backend Setup
- ✅ Auth service has `signInWithGoogle()` method
- ✅ OAuth callback handler at `/auth/callback`
- ✅ Database trigger to create user records for OAuth users
- ✅ Profile creation for OAuth users with metadata extraction

### 2. Frontend Setup
- ✅ Google sign-in button added to LoginForm
- ✅ Proper error handling and loading states
- ✅ OAuth callback page with session validation
- ✅ Automatic redirect to dashboard after successful auth

## Testing Steps

### Step 1: Configure Google OAuth in Supabase Dashboard

Before testing, you need to configure Google OAuth in your Supabase project:

1. Go to: https://supabase.com/dashboard/project/wobpryllvdjaapzjbsxx
2. Navigate to: **Authentication** → **Providers**
3. Find **Google** and click to configure
4. Enable the Google provider
5. Add your OAuth credentials:
   - **Client ID**: Get from Google Cloud Console
   - **Client Secret**: Get from Google Cloud Console
6. Add authorized redirect URL:
   ```
   https://wobpryllvdjaapzjbsxx.supabase.co/auth/v1/callback
   ```

### Step 2: Configure Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen if not done
6. Add authorized redirect URIs:
   ```
   https://wobpryllvdjaapzjbsxx.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```
7. Copy the **Client ID** and **Client Secret**

### Step 3: Test the Flow

1. **Start the dev server** (already running):
   ```
   http://localhost:3000
   ```

2. **Navigate to login page**:
   ```
   http://localhost:3000/login
   ```

3. **Click "Sign in with Google"** button

4. **Expected flow**:
   - Redirects to Google OAuth consent screen
   - User selects Google account
   - User grants permissions
   - Redirects back to `/auth/callback`
   - Creates user record in database
   - Creates user profile with Google metadata
   - Redirects to `/dashboard`

### Step 4: Verify in Browser Console

Open browser DevTools (F12) and check the Console tab for logs:

```
[AuthService] Initiating Google OAuth sign-in...
[AuthService] Google OAuth redirect initiated
[AuthCallbackPage] Processing OAuth callback...
[AuthCallbackPage] Session found, user authenticated
[AuthService] Ensuring user profile for OAuth user: <user-id>
[AuthCallbackPage] Redirecting to dashboard
```

### Step 5: Verify in Database

Check Supabase dashboard to confirm:

1. **auth.users** table has new user
2. **public.users** table has corresponding record
3. **public.user_profiles** table has profile with Google metadata

## Troubleshooting

### Issue: "Authentication failed" error

**Possible causes:**
- Google OAuth not configured in Supabase
- Invalid redirect URI
- Missing OAuth credentials

**Solution:**
- Double-check Supabase provider configuration
- Verify redirect URIs match exactly
- Check browser console for detailed error messages

### Issue: User created but no profile

**Possible causes:**
- Database trigger not deployed
- RLS policies blocking insert

**Solution:**
- Deploy migration: `supabase db push`
- Check migration 034_fix_oauth_trigger_final.sql is applied

### Issue: Redirect loop

**Possible causes:**
- Session not being set properly
- Callback URL mismatch

**Solution:**
- Clear browser cookies and try again
- Verify callback URL in auth service matches Supabase config

## Current Configuration

- **Supabase URL**: https://wobpryllvdjaapzjbsxx.supabase.co
- **Callback URL**: `${window.location.origin}/auth/callback`
- **Default Role**: `individual`
- **Forest Preference**: Set during onboarding

## Next Steps After Successful Test

1. Test with multiple Google accounts
2. Test error scenarios (denied permissions, etc.)
3. Verify profile data is correctly extracted
4. Test logout and re-login flow
5. Verify welcome badge generation for OAuth users

## Notes

- OAuth users skip the password requirement
- Profile completion happens during onboarding
- Welcome badge should be generated automatically
- Forest preference can be set later in onboarding
