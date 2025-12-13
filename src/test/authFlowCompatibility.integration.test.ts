import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from '../services/auth.service';
import { supabase } from '../services/supabase';

/**
 * Authentication Flow Compatibility Integration Tests
 * 
 * Integration tests that verify existing authentication methods still work after OAuth callback routing changes.
 * These tests focus on the actual authentication service functionality.
 * 
 * Requirements: 4.4 - Authentication flow compatibility
 */

// Mock Supabase
vi.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: {} } })),
      exchangeCodeForSession: vi.fn(),
      setSession: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Mock other dependencies
vi.mock('../services/userCache', () => ({
  userCache: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock('../utils/retry', () => ({
  withRetry: vi.fn((fn) => fn()),
  DEFAULT_RETRY_CONFIG: {},
}));

vi.mock('../utils/supabaseHealth', () => ({
  checkSupabaseHealth: vi.fn().mockResolvedValue(true),
}));

vi.mock('../types/authError.types', () => ({
  categorizeAuthError: vi.fn((error) => ({
    type: 'AUTH_ERROR',
    userMessage: error?.message || 'Authentication failed',
    retryable: false,
  })),
}));

vi.mock('../utils/errorLogging', () => ({
  logAuthError: vi.fn(),
}));

vi.mock('../services/hummingbirdBadge.service', () => ({
  hummingbirdBadgeService: {
    createDefaultHummingbirdConfig: vi.fn(),
    generateHummingbirdBadge: vi.fn(),
  },
}));

vi.mock('../services/badgeProgression.service', () => ({
  badgeProgressionService: {
    initializeUserBadgeProgression: vi.fn(),
  },
}));

vi.mock('../utils/redirectDestination', () => ({
  storeCurrentPageAsDestination: vi.fn(),
}));

describe('Authentication Flow Compatibility - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default successful responses
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Email/Password Authentication Compatibility', () => {
    it('should successfully authenticate with email and password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'individual' as const,
        created_at: new Date().toISOString(),
      };

      // Mock successful login
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: {} as any,
        },
        error: null,
      } as any);

      // Mock user data retrieval
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      } as any);

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                ...mockUser,
                user_profiles: null,
              },
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.error).toBeNull();
      expect(result.user).toBeTruthy();
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should handle email authentication errors gracefully', async () => {
      // Mock login failure
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('Invalid credentials'),
      } as any);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.error).toBeInstanceOf(Error);
      expect(result.user).toBeNull();
    });

    it('should support user registration', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'new@example.com',
        role: 'individual' as const,
        created_at: new Date().toISOString(),
      };

      // Mock successful registration
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: {
          user: { id: 'user-456', email: 'new@example.com' },
          session: null,
        },
        error: null,
      } as any);

      // Mock user data retrieval
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-456', email: 'new@example.com' } },
        error: null,
      } as any);

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                ...mockUser,
                user_profiles: null,
              },
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const result = await authService.register({
        email: 'new@example.com',
        password: 'password123',
        role: 'individual',
      });

      expect(result.error).toBeNull();
      expect(result.user).toBeTruthy();
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          data: {
            role: 'individual',
            forest_preference: undefined,
          },
        },
      });
    });
  });

  describe('OAuth Authentication Compatibility', () => {
    it('should successfully initiate Google OAuth', async () => {
      // Mock successful OAuth initiation
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: 'https://accounts.google.com/oauth/authorize' },
        error: null,
      } as any);

      const result = await authService.signInWithGoogle();

      expect(result.error).toBeNull();
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
    });

    it('should handle OAuth errors', async () => {
      // Mock OAuth failure
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: null, url: null },
        error: new Error('OAuth provider error'),
      } as any);

      const result = await authService.signInWithGoogle();

      expect(result.error).toBeInstanceOf(Error);
    });

    it('should store redirect destination before OAuth', async () => {
      // Mock successful OAuth initiation
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: 'https://accounts.google.com/oauth/authorize' },
        error: null,
      } as any);

      const { storeCurrentPageAsDestination } = await import('../utils/redirectDestination');

      await authService.signInWithGoogle();

      expect(storeCurrentPageAsDestination).toHaveBeenCalled();
    });

    it('should handle OAuth callback processing', async () => {
      const mockUser = {
        id: 'oauth-user-123',
        email: 'oauth@example.com',
        user_metadata: {
          full_name: 'OAuth User',
          avatar_url: 'https://example.com/avatar.jpg',
        },
      };

      // Test profile creation for OAuth users
      await authService.ensureUserProfile(mockUser.id, {
        full_name: mockUser.user_metadata.full_name,
        avatar_url: mockUser.user_metadata.avatar_url,
      });

      // Verify profile creation was attempted
      expect(supabase.from).toHaveBeenCalledWith('users');
    });
  });

  describe('Session Management Compatibility', () => {
    it('should retrieve current user session', async () => {
      const mockUser = {
        id: 'session-user-123',
        email: 'session@example.com',
        role: 'individual' as const,
        created_at: new Date().toISOString(),
      };

      // Mock session retrieval
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'session-user-123', email: 'session@example.com' } },
        error: null,
      } as any);

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                ...mockUser,
                user_profiles: null,
              },
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const user = await authService.getCurrentUser();

      expect(user).toBeTruthy();
      expect(user?.id).toBe('session-user-123');
      expect(supabase.auth.getUser).toHaveBeenCalled();
    });

    it('should handle session logout', async () => {
      // Mock successful logout
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      const result = await authService.logout();

      expect(result.error).toBeNull();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should get current session', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
      };

      // Mock session retrieval
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as any);

      const session = await authService.getSession();

      expect(session).toEqual(mockSession);
      expect(supabase.auth.getSession).toHaveBeenCalled();
    });
  });

  describe('Password Reset Compatibility', () => {
    it('should request password reset', async () => {
      // Mock successful password reset request
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      } as any);

      const result = await authService.requestPasswordReset('test@example.com');

      expect(result.error).toBeNull();
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/reset-password'),
        })
      );
    });

    it('should update password', async () => {
      // Mock successful password update
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any);

      const result = await authService.updatePassword('newpassword123');

      expect(result.error).toBeNull();
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });
    });
  });

  describe('Role-Based Access Compatibility', () => {
    it('should check user roles correctly', () => {
      const adminUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin' as const,
        created_at: new Date().toISOString(),
      };

      const individualUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'individual' as const,
        created_at: new Date().toISOString(),
      };

      // Test role checking methods
      expect(authService.hasRole(adminUser, 'admin')).toBe(true);
      expect(authService.hasRole(adminUser, 'individual')).toBe(false);
      expect(authService.hasRole(individualUser, 'individual')).toBe(true);
      expect(authService.hasRole(individualUser, 'admin')).toBe(false);

      expect(authService.isAdmin(adminUser)).toBe(true);
      expect(authService.isAdmin(individualUser)).toBe(false);

      expect(authService.hasAnyRole(adminUser, ['admin', 'organization'])).toBe(true);
      expect(authService.hasAnyRole(individualUser, ['admin', 'organization'])).toBe(false);
    });

    it('should handle null user for role checks', () => {
      expect(authService.hasRole(null, 'admin')).toBe(false);
      expect(authService.isAdmin(null)).toBe(false);
      expect(authService.hasAnyRole(null, ['admin'])).toBe(false);
    });
  });

  describe('Error Handling Consistency', () => {
    it('should handle network errors consistently across auth methods', async () => {
      const networkError = new Error('Network error');

      // Mock network errors for all methods
      vi.mocked(supabase.auth.signInWithPassword).mockRejectedValue(networkError);
      vi.mocked(supabase.auth.signInWithOAuth).mockRejectedValue(networkError);
      vi.mocked(supabase.auth.signUp).mockRejectedValue(networkError);

      // Test that all methods handle network errors
      const loginResult = await authService.login({
        email: 'test@example.com',
        password: 'password',
      });
      expect(loginResult.error).toBeInstanceOf(Error);

      const oauthResult = await authService.signInWithGoogle();
      expect(oauthResult.error).toBeInstanceOf(Error);

      const registerResult = await authService.register({
        email: 'test@example.com',
        password: 'password',
        role: 'individual',
      });
      expect(registerResult.error).toBeInstanceOf(Error);
    });

    it('should handle authentication failures consistently', async () => {
      const authError = new Error('Authentication failed');

      // Mock authentication failures
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: authError,
      } as any);

      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: null, url: null },
        error: authError,
      } as any);

      // Test consistent error handling
      const emailResult = await authService.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      });
      expect(emailResult.error).toBeInstanceOf(Error);
      expect(emailResult.user).toBeNull();

      const oauthResult = await authService.signInWithGoogle();
      expect(oauthResult.error).toBeInstanceOf(Error);
    });
  });

  describe('Concurrent Authentication Handling', () => {
    it('should handle concurrent authentication attempts', async () => {
      // Mock successful responses with delays
      vi.mocked(supabase.auth.signInWithPassword).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          data: { user: { id: 'user-1' }, session: {} },
          error: null,
        } as any), 100))
      );

      vi.mocked(supabase.auth.signInWithOAuth).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          data: { provider: 'google', url: 'https://oauth.url' },
          error: null,
        } as any), 150))
      );

      // Mock user data retrieval
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      } as any);

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'user-1',
                email: 'test@example.com',
                role: 'individual',
                created_at: new Date().toISOString(),
                user_profiles: null,
              },
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      // Test concurrent calls
      const promises = [
        authService.login({ email: 'test1@example.com', password: 'password123' }),
        authService.signInWithGoogle(),
        authService.login({ email: 'test2@example.com', password: 'password123' }),
      ];

      const results = await Promise.all(promises);

      // All should complete
      expect(results).toHaveLength(3);
      expect(results[0]).toBeDefined(); // Login result
      expect(results[1]).toBeDefined(); // OAuth result
      expect(results[2]).toBeDefined(); // Second login result
    });
  });

  describe('Authentication State Management', () => {
    it('should handle auth state changes', () => {
      const mockCallback = vi.fn();
      
      // Test auth state change subscription
      const unsubscribe = authService.onAuthStateChange(mockCallback);
      
      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
      expect(unsubscribe).toBeDefined();
    });

    it('should maintain user cache correctly', async () => {
      const mockUser = {
        id: 'cached-user-123',
        email: 'cached@example.com',
        role: 'individual' as const,
        created_at: new Date().toISOString(),
      };

      // Mock user retrieval
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'cached-user-123', email: 'cached@example.com' } },
        error: null,
      } as any);

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                ...mockUser,
                user_profiles: null,
              },
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      // First call should fetch from database
      const user1 = await authService.getCurrentUser();
      expect(user1).toBeTruthy();

      // Second call should use cache (mocked)
      const user2 = await authService.getCurrentUser();
      expect(user2).toBeTruthy();

      // Both should return the same user
      expect(user1?.id).toBe(user2?.id);
    });
  });
});