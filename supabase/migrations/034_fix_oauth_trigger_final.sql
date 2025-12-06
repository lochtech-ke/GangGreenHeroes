-- ============================================================================
-- Final Fix for OAuth Trigger - Ensure Proper User Creation
-- ============================================================================
-- This migration ensures the trigger function works correctly for OAuth users
-- and adds a fallback INSERT policy with proper permissions
-- ============================================================================

-- Drop existing trigger and function to recreate cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate the trigger function with enhanced error handling and logging
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log the trigger execution
  RAISE LOG 'handle_new_user trigger fired for user: %', NEW.id;
  
  -- Insert into users table with default values for OAuth users
  INSERT INTO public.users (id, email, role, forest_preference)
  VALUES (
    NEW.id,
    NEW.email,
    -- Default to 'individual' if role is not provided (OAuth users)
    COALESCE(NEW.raw_user_meta_data->>'role', 'individual'),
    -- Forest preference can be null for OAuth users
    NEW.raw_user_meta_data->>'forest_preference'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RAISE LOG 'User record created/updated successfully for: %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE WARNING 'Error in handle_new_user trigger for user %: % %', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure the INSERT policy exists for fallback manual inserts
DROP POLICY IF EXISTS "Users can insert own user record" ON users;
CREATE POLICY "Users can insert own user record"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Grant necessary permissions to the authenticated role
GRANT INSERT ON public.users TO authenticated;
GRANT UPDATE ON public.users TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- The trigger should now properly create user records for OAuth authentication
-- If the trigger fails, the manual insert will work as a fallback
-- ============================================================================
