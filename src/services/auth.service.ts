import { supabase } from './supabase';
import { userCache } from './userCache';
import { withRetry, DEFAULT_RETRY_CONFIG } from '../utils/retry';
import { checkSupabaseHealth } from '../utils/supabaseHealth';
import { categorizeAuthError } from '../types/authError.types';
import { logAuthError } from '../utils/errorLogging';
import { hummingbirdBadgeService } from './hummingbirdBadge.service';
import { badgeProgressionService } from './badgeProgression.service';
import { storeCurrentPageAsDestination } from '../utils/redirectDestination';
import type {
  User,
  RegisterData,
  LoginCredentials,
  AuthResponse,
  UserRole,
  UserProfile,
} from '../types/user.types';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

/**
 * Authentication Service
 * Handles user authentication, registration, and session management
 */
class AuthService {
  /**
   * Register a new user with email and password
   * Profile completion will be handled by the onboarding chatbot
   * Enhanced with retry logic, health checks, and error categorization
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const start = performance.now();
    console.time('AuthService.register');

    try {
      console.log('[AuthService] Starting registration...', {
        email: data.email,
      });

      // Perform health check but don't block on failure
      const isHealthy = await checkSupabaseHealth();
      if (!isHealthy) {
        console.warn('[AuthService] Health check failed, proceeding anyway');
      } else {
        console.log('[AuthService] Health check passed');
      }

      // Step 1: Create auth user with retry logic
      // Note: User record in 'users' table is automatically created by database trigger
      const { data: authData, error: authError } = await withRetry(
        () =>
          supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
              data: {
                role: data.role || 'individual',
                forest_preference: data.forest_preference,
              },
            },
          }),
        DEFAULT_RETRY_CONFIG,
        'signUp'
      );

      console.log('[AuthService] SignUp response:', { authData, authError });

      if (authError) {
        const enhancedError = categorizeAuthError(authError);
        console.error('[AuthService] SignUp error:', {
          type: enhancedError.type,
          message: enhancedError.message,
          retryable: enhancedError.retryable,
        });
        return {
          user: null,
          error: new Error(enhancedError.userMessage),
        };
      }

      if (!authData.user) {
        console.error('[AuthService] No user in auth data');
        return {
          user: null,
          error: new Error('User registration failed. Please try again.'),
        };
      }

      console.log('[AuthService] Auth user created:', authData.user.id);

      // Step 2: Skip profile creation - will be handled by onboarding chatbot
      // Profile will be created when user completes the onboarding flow
      // Only create profile if additional data is provided (for backward compatibility)
      if (data.full_name || data.phone || data.organization || data.location) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            full_name: data.full_name,
            phone: data.phone,
            organization: data.organization,
            location: data.location,
          });

        if (profileError) {
          // Don't fail registration if profile creation fails
          // User can complete profile through onboarding chatbot
          console.warn(
            'Profile creation failed, will be handled by onboarding:',
            profileError
          );
        }
      }

      // Step 3: Fetch complete user data
      console.log('[AuthService] Fetching complete user data...');
      const user = await this.getCurrentUser();
      console.log('[AuthService] User data fetched:', user);

      // Step 4: Initialize badge progression and generate Hummingbird welcome badge
      try {
        // Initialize badge progression system
        await badgeProgressionService.initializeUserBadgeProgression(authData.user.id);
        
        // Generate the actual SVG badge and create notification
        await this.generateHummingbirdWelcomeBadge(authData.user.id, data.forest_preference || 'kakamega');
        await this.createHummingbirdWelcomeNotification(authData.user.id);
        console.log('[AuthService] Hummingbird welcome badge and notification created successfully');
      } catch (badgeError) {
        // Don't fail registration if badge generation fails
        // User can still use the platform, badge can be generated later
        console.warn('[AuthService] Failed to generate welcome badge:', badgeError);
        
        // Create a fallback notification without badge details
        try {
          await this.createFallbackWelcomeNotification(authData.user.id);
        } catch (fallbackError) {
          console.warn('[AuthService] Failed to create fallback notification:', fallbackError);
        }
      }

      const duration = performance.now() - start;
      console.timeEnd('AuthService.register');
      console.log(
        `[AuthService] Registration completed in ${duration.toFixed(2)}ms`
      );

      if (duration > 1000) {
        console.warn(
          `[AuthService] Slow registration detected: ${duration.toFixed(2)}ms`
        );
      }

      return { user, error: null };
    } catch (error) {
      const duration = performance.now() - start;
      const enhancedError = categorizeAuthError(error);
      console.error('[AuthService] Registration exception:', {
        type: enhancedError.type,
        message: enhancedError.message,
        duration: `${duration.toFixed(2)}ms`,
      });
      return {
        user: null,
        error: new Error(enhancedError.userMessage),
      };
    }
  }

  /**
   * Sign in with Google OAuth
   * Uses Supabase's built-in OAuth provider
   */
  async signInWithGoogle(): Promise<{ error: Error | null }> {
    try {
      console.log('[AuthService] Initiating Google OAuth sign-in...');

      // Store current page as redirect destination before OAuth redirect
      // Requirements: 5.5
      storeCurrentPageAsDestination();

      // Use environment variable for app URL, fallback to window.location.origin
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const redirectUrl = `${appUrl}/auth/callback`;
      
      console.log('[AuthService] OAuth redirect URL:', redirectUrl);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        const enhancedError = categorizeAuthError(error);
        logAuthError('AuthService.signInWithGoogle', error, {
          type: enhancedError.type,
          retryable: enhancedError.retryable,
        });
        return { error: new Error(enhancedError.userMessage) };
      }

      console.log('[AuthService] Google OAuth redirect initiated');
      return { error: null };
    } catch (error) {
      const enhancedError = categorizeAuthError(error);
      logAuthError('AuthService.signInWithGoogle', error, {
        type: enhancedError.type,
        retryable: enhancedError.retryable,
      });
      return {
        error: error instanceof Error ? error : new Error('Google sign-in failed'),
      };
    }
  }

  /**
   * Login with email and password
   * Enhanced with retry logic, health checks, and error categorization
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const start = performance.now();

    try {
      console.log('[AuthService] Starting login for:', credentials.email);

      // Run health check in background without blocking login
      checkSupabaseHealth().then(isHealthy => {
        if (!isHealthy) {
          console.warn('[AuthService] Health check failed (background check)');
        } else {
          console.log('[AuthService] Health check passed (background check)');
        }
      }).catch(err => {
        console.warn('[AuthService] Health check error (background check):', err);
      });

      // Attempt login with retry logic
      const { data, error } = await withRetry(
        () =>
          supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          }),
        DEFAULT_RETRY_CONFIG,
        'signInWithPassword'
      );

      if (error) {
        const enhancedError = categorizeAuthError(error);
        console.error('[AuthService] Login error:', {
          type: enhancedError.type,
          message: enhancedError.message,
          retryable: enhancedError.retryable,
        });
        return {
          user: null,
          error: new Error(enhancedError.userMessage),
        };
      }

      if (!data.user) {
        console.error('[AuthService] No user in response');
        return {
          user: null,
          error: new Error('Login failed. Please try again.'),
        };
      }

      console.log('[AuthService] Auth successful, fetching user data...');
      const user = await this.getCurrentUser();
      console.log('[AuthService] User data retrieved:', !!user);

      const duration = performance.now() - start;
      console.log(`[AuthService] Login completed in ${duration.toFixed(2)}ms`);

      if (duration > 1000) {
        console.warn(
          `[AuthService] Slow login detected: ${duration.toFixed(2)}ms`
        );
      }

      return { user, error: null };
    } catch (error) {
      const duration = performance.now() - start;
      const enhancedError = categorizeAuthError(error);
      console.error('[AuthService] Login exception:', {
        type: enhancedError.type,
        message: enhancedError.message,
        duration: `${duration.toFixed(2)}ms`,
      });
      return {
        user: null,
        error: new Error(enhancedError.userMessage),
      };
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut();

      // Clear cache on logout
      userCache.clear();
      console.log('[AuthService] User cache cleared on logout');

      return { error };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Logout failed'),
      };
    }
  }

  /**
   * Get current authenticated user with profile data
   * Optimized with single JOIN query, caching, and retry logic
   */
  async getCurrentUser(): Promise<User | null> {
    const start = performance.now();

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        console.log('[AuthService] No auth user found');
        return null;
      }

      // Check cache first
      const cached = userCache.get(authUser.id);
      if (cached) {
        const duration = performance.now() - start;
        console.log(
          `[AuthService] User served from cache (${duration.toFixed(2)}ms)`
        );
        return cached;
      }

      console.log('[AuthService] Cache miss, fetching from database');

      // Single query with JOIN to fetch user and profile data, with retry logic
      const result = await withRetry(
        async () => {
          const response = await supabase
            .from('users')
            .select(`
              *,
              user_profiles (*)
            `)
            .eq('id', authUser.id)
            .maybeSingle();

          // Throw error if query failed to trigger retry
          if (response.error) {
            throw response.error;
          }

          return response;
        },
        DEFAULT_RETRY_CONFIG,
        'getCurrentUser'
      );

      const { data, error } = result;

      if (error) {
        console.error('[AuthService] Failed to fetch user data:', error);
        return null;
      }

      if (!data) {
        console.error('[AuthService] No user data found for ID:', authUser.id);
        return null;
      }

      // Transform the response to match User type
      const user = this.transformUserData(data);

      // Cache the result
      userCache.set(authUser.id, user);

      const duration = performance.now() - start;
      console.log(
        `[AuthService] getCurrentUser completed in ${duration.toFixed(2)}ms`
      );

      if (duration > 1000) {
        console.warn(
          `[AuthService] Slow query detected: ${duration.toFixed(2)}ms`
        );
      }

      return user;
    } catch (error) {
      const duration = performance.now() - start;
      console.error('[AuthService] Error fetching current user:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration.toFixed(2)}ms`,
      });
      return null;
    }
  }

  /**
   * Transform database response to User type
   * Handles the joined user_profiles data
   */
  private transformUserData(data: any): User {
    console.log('[AuthService] Transforming user data:', JSON.stringify(data, null, 2));

    // Extract profile data (Supabase returns joined data as array or object)
    let profile: UserProfile | undefined;

    if (data.user_profiles) {
      // Handle both array and object responses
      const profileData = Array.isArray(data.user_profiles)
        ? data.user_profiles[0]
        : data.user_profiles;

      if (profileData) {
        profile = {
          full_name: profileData.full_name,
          phone: profileData.phone,
          organization: profileData.organization,
          location: profileData.location,
          avatar_url: profileData.avatar_url,
        };
      }
    }

    const user: User = {
      id: data.id,
      email: data.email,
      role: data.role,
      forest_preference: data.forest_preference,
      created_at: data.created_at,
      profile,
    };

    console.log('[AuthService] Transformed user:', JSON.stringify(user, null, 2));
    return user;
  }

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error fetching session:', error);
      return null;
    }
  }

  /**
   * Request password reset email
   */
  async requestPasswordReset(email: string): Promise<{ error: Error | null }> {
    try {
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/reset-password`,
      });
      return { error };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Password reset request failed'),
      };
    }
  }

  /**
   * Update password with reset token
   */
  async updatePassword(newPassword: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Password update failed'),
      };
    }
  }

  /**
   * Check if user has specific role
   */
  hasRole(user: User | null, role: UserRole): boolean {
    return user?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(user: User | null, roles: UserRole[]): boolean {
    return user ? roles.includes(user.role) : false;
  }

  /**
   * Check if user is admin
   */
  isAdmin(user: User | null): boolean {
    return this.hasRole(user, 'admin');
  }

  /**
   * Check if user is organization
   */
  isOrganization(user: User | null): boolean {
    return this.hasRole(user, 'organization');
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      // Clear cache on sign out or token refresh
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        userCache.clear();
        console.log(`[AuthService] Cache cleared on ${event}`);
      }

      if (session?.user) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Ensure user profile exists for OAuth users
   * Note: The users table record is automatically created by database trigger (handle_new_user)
   * This function creates both the users record (if trigger failed) and user_profiles record
   */
  async ensureUserProfile(userId: string, metadata?: any): Promise<void> {
    const start = performance.now();
    try {
      console.log('[AuthService] Ensuring user profile for OAuth user:', userId);

      // Get auth user to extract metadata
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        throw new Error('No authenticated user found');
      }

      // Extract profile data from OAuth metadata
      const fullName = metadata?.full_name || 
                      authUser.user_metadata?.full_name || 
                      authUser.user_metadata?.name ||
                      authUser.email?.split('@')[0] || 
                      'User';
      
      const avatarUrl = metadata?.avatar_url || 
                       authUser.user_metadata?.avatar_url || 
                       authUser.user_metadata?.picture;

      console.log('[AuthService] Extracted OAuth metadata:', { fullName, avatarUrl });

      // Step 1: Ensure user record exists in users table
      // The trigger should handle this, but we'll check and create if needed
      const { data: existingUser, error: userFetchError } = await supabase
        .from('users')
        .select('id, role, forest_preference')
        .eq('id', userId)
        .maybeSingle();

      if (userFetchError && userFetchError.code !== 'PGRST116') {
        console.error('[AuthService] Error checking user record:', userFetchError);
        throw userFetchError;
      }

      if (!existingUser) {
        console.warn('[AuthService] User record not found - database trigger may have failed or not been deployed');
        console.warn('[AuthService] Please deploy migration 023_fix_oauth_trigger_for_google.sql');
        
        // Try to create user record manually if trigger failed
        // Note: This may fail due to RLS policies or cascading triggers
        const { error: userInsertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: authUser.email!,
            role: 'individual', // Default role for OAuth users
            forest_preference: null, // Will be set during onboarding
          });

        if (userInsertError) {
          // Ignore duplicate key errors (user already exists)
          if (userInsertError.code === '23505') {
            console.log('[AuthService] User record already exists (duplicate key)');
          }
          // Ignore RLS policy errors - these indicate the trigger needs to be deployed
          else if (userInsertError.code === '42501') {
            console.error('[AuthService] RLS policy error - migration 023 needs to be deployed');
            console.error('[AuthService] Run: supabase db push');
            throw new Error('Database setup incomplete. Please contact support.');
          }
          // Other errors should be thrown
          else {
            console.error('[AuthService] Error creating user record:', userInsertError);
            throw userInsertError;
          }
        } else {
          console.log(`[AuthService] User record created successfully (${(performance.now() - start).toFixed(2)}ms)`);
        }
      } else {
        console.log('[AuthService] User record exists:', existingUser);
      }

      // Step 2: Check if profile exists in user_profiles table
      const { data: existingProfile, error: profileFetchError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (profileFetchError && profileFetchError.code !== 'PGRST116') {
        console.error('[AuthService] Error checking profile:', profileFetchError);
        throw profileFetchError;
      }

      if (!existingProfile) {
        console.log('[AuthService] Creating profile for OAuth user');

        const profileData: any = {
          id: userId,
          full_name: fullName,
        };

        if (avatarUrl) {
          profileData.avatar_url = avatarUrl;
        }

        // Create the profile with retry logic
        let retries = 3;
        let lastError: any = null;

        while (retries > 0) {
          const { error: profileInsertError } = await supabase
            .from('user_profiles')
            .insert(profileData);

          if (!profileInsertError) {
            console.log(`[AuthService] Profile created successfully for OAuth user (${(performance.now() - start).toFixed(2)}ms)`);
            return;
          }

          // If it's a foreign key violation, wait and retry
          if (profileInsertError.code === '23503' && retries > 1) {
            console.log(`[AuthService] Foreign key violation, retrying... (${retries - 1} attempts left)`);
            lastError = profileInsertError;
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
            retries--;
            continue;
          }

          // For other errors or last retry, throw immediately
          console.error('[AuthService] Error creating profile:', profileInsertError);
          throw profileInsertError;
        }

        // If we exhausted retries
        if (lastError) {
          console.error('[AuthService] Failed to create profile after retries:', lastError);
          throw lastError;
        }
      } else {
        console.log(`[AuthService] Profile already exists for OAuth user (${(performance.now() - start).toFixed(2)}ms)`);
      }
    } catch (error) {
      console.error('[AuthService] Failed to ensure user profile:', error);
      throw error; // Throw error so caller can handle it appropriately
    }
  }

  /**
   * Generate Hummingbird welcome badge for new users
   * Private helper method called during registration
   */
  private async generateHummingbirdWelcomeBadge(userId: string, forestPreference: string): Promise<void> {
    try {
      console.log('[AuthService] Generating Hummingbird welcome badge for user:', userId);
      
      // Create hummingbird badge configuration
      const config = hummingbirdBadgeService.createDefaultHummingbirdConfig(
        userId,
        'bronze', // New users start with bronze tier
        forestPreference
      );

      // Generate the badge SVG
      const result = await hummingbirdBadgeService.generateHummingbirdBadge(config);
      
      if (result.success && result.svg) {
        console.log('[AuthService] Hummingbird badge generated successfully');
        
        // Store the generated SVG in the database
        await this.storeHummingbirdBadgeSVG(userId, result.svg, result.metadata);
      } else {
        console.error('[AuthService] Failed to generate Hummingbird badge:', result);
      }
    } catch (error) {
      console.error('[AuthService] Error generating Hummingbird badge:', error);
      throw error;
    }
  }

  /**
   * Store the generated Hummingbird badge SVG in the database
   * Private helper method for badge storage
   */
  private async storeHummingbirdBadgeSVG(userId: string, svg: string, metadata: any): Promise<void> {
    try {
      // Check if nft_badges table exists and store the badge
      const { error } = await supabase.from('nft_badges').insert({
        user_id: userId,
        badge_name: 'Hummingbird Welcome Badge',
        tier: 'bronze',
        forest: metadata?.forestName || 'Kakamega Forest',
        achievement_type: 'welcome_badge',
        achievement_count: 1,
        svg_content: svg,
        metadata: {
          ...metadata,
          generated_at: new Date().toISOString(),
          is_welcome_badge: true,
        },
      });

      if (error) {
        console.warn('[AuthService] Could not store Hummingbird badge SVG:', error);
      } else {
        console.log('[AuthService] Hummingbird badge SVG stored successfully');
      }
    } catch (error) {
      console.warn('[AuthService] Badge storage system not available:', error);
    }
  }

  /**
   * Create Hummingbird welcome notification for new users
   * Private helper method called during registration
   */
  private async createHummingbirdWelcomeNotification(userId: string): Promise<void> {
    try {
      // Check if notifications table exists and create welcome notification
      const { error } = await supabase.from('notifications').insert({
        user_id: userId,
        type: 'badge_earned',
        title: 'Welcome to #GangGreen! 🐦',
        message: 'You\'ve earned your first badge: The Hummingbird! Like the hummingbird in Wangari Maathai\'s story, every small action counts. Start your journey today!',
        metadata: {
          badge_name: 'Hummingbird',
          badge_tier: 'hummingbird',
          is_welcome: true,
        },
      });

      if (error) {
        console.warn('[AuthService] Could not create Hummingbird notification:', error);
      } else {
        console.log('[AuthService] Hummingbird welcome notification created');
      }
    } catch (error) {
      console.warn('[AuthService] Notification system not available:', error);
    }
  }

  /**
   * Create fallback welcome notification when badge generation fails
   * Private helper method for error recovery
   */
  private async createFallbackWelcomeNotification(userId: string): Promise<void> {
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: userId,
        type: 'welcome',
        title: 'Welcome to #GangGreen! 🌱',
        message: 'Welcome to the community! Your journey toward environmental impact starts now. Explore initiatives, connect with others, and make a difference!',
        metadata: {
          is_welcome: true,
          is_fallback: true,
        },
      });

      if (error) {
        console.warn('[AuthService] Could not create fallback notification:', error);
      } else {
        console.log('[AuthService] Fallback welcome notification created');
      }
    } catch (error) {
      console.warn('[AuthService] Fallback notification system not available:', error);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
