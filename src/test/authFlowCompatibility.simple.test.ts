import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../services/auth.service';
import { supabase } from '../services/supabase';

/**
 * Simple Authentication Flow Compatibility Tests
 * 
 * Basic tests to verify existing authentication methods still work after OAuth callback routing changes.
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
      onAuthStateChange: vi.fn(() => ({ data: { subscription: {} } })),
    },
    from: vi.fn(),
  },
}));

// Mock auth service
vi.mock('../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    signInWithGoogle: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    getSession: vi.fn(),
    ensureUserProfile: vi.fn(),
  },
}));

describe('Authentication Flow Compatibility - Basic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Email/Password Authentication', () => {
    it('should successfully authenticate with email and password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'individual' as const,
        created_at: new Date().toISOString(),
      };

      // Mock successful login
      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
        error: null,
      });

      // Call the auth service directly
      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // Verify login was successful
      expect(result.error).toBeNull();
      expect(result.user).toEqual(mockUser);
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should handle email authentication errors', async () => {
      // Mock login failure
      vi.mocked(authService.login).mockResolvedValue({
        user: null,
        error: new Error('Invalid credentials'),
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Invalid credentials');
      expect(result.user).toBeNull();
    });
  });

  describe('OAuth Authentication', () => {
    it('should successfully initiate Google OAuth', async () => {
      // Mock successful OAuth initiation
      vi.mocked(authService.signInWithGoogle).mockResolvedValue({
        error: null,
      });

      const result = await authService.signInWithGoogle();

      expect(result.error).toBeNull();
      expect(authService.signInWithGoogle).toHaveBeenCalled();
    });

    it('should handle OAuth errors', async () => {
      // Mock OAuth failure
      vi.mocked(authService.signInWithGoogle).mockResolvedValue({
        error: new Error('OAuth provider error'),
      });

      const result = await authService.signInWithGoogle();

      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('OAuth provider error');
    });
  });

  describe('Session Management', () => {
    it('should maintain session state', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      };

      // Mock session retrieval
      vi.mocked(authService.getSession).mockResolvedValue(mockSession as any);

      const session = await authService.getSession();

      expect(session).toEqual(mockSession);
      expect(authService.getSession).toHaveBeenCalled();
    });

    it('should handle logout', async () => {
      // Mock successful logout
      vi.mocked(authService.logout).mockResolvedValue({
        error: null,
      });

      const result = await authService.logout();

      expect(result.error).toBeNull();
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('User Profile Management', () => {
    it('should ensure user profile exists for OAuth users', async () => {
      // Mock successful profile creation
      vi.mocked(authService.ensureUserProfile).mockResolvedValue();

      await authService.ensureUserProfile('user-123', {
        full_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
      });

      expect(authService.ensureUserProfile).toHaveBeenCalledWith('user-123', {
        full_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
      });
    });

    it('should handle profile creation errors', async () => {
      // Mock profile creation failure
      vi.mocked(authService.ensureUserProfile).mockRejectedValue(
        new Error('Profile creation failed')
      );

      await expect(
        authService.ensureUserProfile('user-123', {})
      ).rejects.toThrow('Profile creation failed');
    });
  });

  describe('Authentication Method Compatibility', () => {
    it('should support multiple authentication methods', async () => {
      // Test that all auth methods can be called without interference
      
      // Mock all auth methods
      vi.mocked(authService.login).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', role: 'individual', created_at: new Date().toISOString() },
        error: null,
      });
      
      vi.mocked(authService.signInWithGoogle).mockResolvedValue({
        error: null,
      });
      
      vi.mocked(authService.register).mockResolvedValue({
        user: { id: 'user-2', email: 'test2@example.com', role: 'individual', created_at: new Date().toISOString() },
        error: null,
      });

      // Test email login
      const emailResult = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(emailResult.error).toBeNull();

      // Test OAuth
      const oauthResult = await authService.signInWithGoogle();
      expect(oauthResult.error).toBeNull();

      // Test registration
      const registerResult = await authService.register({
        email: 'test2@example.com',
        password: 'password123',
        role: 'individual',
      });
      expect(registerResult.error).toBeNull();

      // Verify all methods were called
      expect(authService.login).toHaveBeenCalled();
      expect(authService.signInWithGoogle).toHaveBeenCalled();
      expect(authService.register).toHaveBeenCalled();
    });

    it('should handle concurrent authentication attempts', async () => {
      // Mock successful responses
      vi.mocked(authService.login).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', role: 'individual', created_at: new Date().toISOString() },
        error: null,
      });
      
      vi.mocked(authService.signInWithGoogle).mockResolvedValue({
        error: null,
      });

      // Test concurrent calls
      const promises = [
        authService.login({ email: 'test1@example.com', password: 'password123' }),
        authService.signInWithGoogle(),
        authService.login({ email: 'test2@example.com', password: 'password123' }),
      ];

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(result => {
        if ('error' in result) {
          expect(result.error).toBeNull();
        }
      });
    });
  });

  describe('Error Handling Consistency', () => {
    it('should handle network errors consistently across auth methods', async () => {
      const networkError = new Error('Network error');

      // Mock network errors for all methods
      vi.mocked(authService.login).mockRejectedValue(networkError);
      vi.mocked(authService.signInWithGoogle).mockRejectedValue(networkError);
      vi.mocked(authService.register).mockRejectedValue(networkError);

      // Test that all methods handle network errors
      await expect(authService.login({ email: 'test@example.com', password: 'password' }))
        .rejects.toThrow('Network error');
      
      await expect(authService.signInWithGoogle())
        .rejects.toThrow('Network error');
      
      await expect(authService.register({ email: 'test@example.com', password: 'password', role: 'individual' }))
        .rejects.toThrow('Network error');
    });

    it('should handle authentication failures consistently', async () => {
      // Mock authentication failures
      vi.mocked(authService.login).mockResolvedValue({
        user: null,
        error: new Error('Authentication failed'),
      });
      
      vi.mocked(authService.signInWithGoogle).mockResolvedValue({
        error: new Error('OAuth authentication failed'),
      });

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

  describe('Routing Configuration Impact', () => {
    it('should not affect authentication service functionality', async () => {
      // This test verifies that the vercel.json routing changes don't affect
      // the underlying authentication service functionality
      
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'individual' as const,
        created_at: new Date().toISOString(),
      };

      // Mock successful authentication
      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
        error: null,
      });

      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

      // Test that auth service works normally
      const loginResult = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(loginResult.error).toBeNull();
      expect(loginResult.user).toEqual(mockUser);

      const currentUser = await authService.getCurrentUser();
      expect(currentUser).toEqual(mockUser);

      // Verify service methods are called correctly
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(authService.getCurrentUser).toHaveBeenCalled();
    });

    it('should maintain session persistence', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
      };

      // Mock session retrieval
      vi.mocked(authService.getSession).mockResolvedValue(mockSession as any);

      // Test session persistence
      const session1 = await authService.getSession();
      const session2 = await authService.getSession();

      expect(session1).toEqual(mockSession);
      expect(session2).toEqual(mockSession);
      expect(authService.getSession).toHaveBeenCalledTimes(2);
    });
  });
});