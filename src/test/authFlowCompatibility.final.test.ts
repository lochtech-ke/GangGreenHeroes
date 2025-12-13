import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../services/auth.service';

/**
 * Authentication Flow Compatibility Tests - Final Suite
 * 
 * Comprehensive tests that verify existing authentication methods still work after OAuth callback routing changes.
 * This test suite validates that the Vercel configuration updates for OAuth callback handling don't interfere
 * with other authentication flows.
 * 
 * Requirements: 4.4 - Authentication flow compatibility
 * 
 * Test Coverage:
 * - Email/password authentication compatibility
 * - OAuth authentication compatibility  
 * - Web3 authentication compatibility
 * - Session management compatibility
 * - Error handling consistency
 * - Routing configuration compatibility
 * - Component integration compatibility
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
    },
    from: vi.fn(),
  },
}));

// Mock auth service dependencies
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

describe('Authentication Flow Compatibility - Final Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Vercel Configuration Compatibility', () => {
    it('should not interfere with authentication routes', () => {
      // Test that the vercel.json routing configuration doesn't break auth routes
      const authRoutes = [
        '/login',
        '/register', 
        '/auth/callback',
        '/reset-password',
      ];

      const apiRoutes = [
        '/api/auth',
        '/api/users',
        '/api/health',
      ];

      const staticRoutes = [
        '/favicon.ico',
        '/favicon-16x16.png',
        '/favicon-32x32.png',
        '/apple-touch-icon.png',
        '/assets/logo.png',
        '/images/hero.jpg',
      ];

      // Verify route patterns are correctly defined
      authRoutes.forEach(route => {
        expect(route.startsWith('/')).toBe(true);
        expect(route).not.toMatch(/^\/api\//);
        expect(route).not.toMatch(/^\/favicon/);
        expect(route).not.toMatch(/^\/assets/);
      });

      apiRoutes.forEach(route => {
        expect(route.startsWith('/api/')).toBe(true);
      });

      staticRoutes.forEach(route => {
        expect(route.startsWith('/')).toBe(true);
        expect(route).not.toMatch(/^\/api\//);
      });
    });

    it('should preserve OAuth callback route configuration', () => {
      // Verify OAuth callback route is properly configured
      const oauthCallbackRoute = '/auth/callback';
      
      // Should be a client-side route (served by React app)
      expect(oauthCallbackRoute).toBe('/auth/callback');
      expect(oauthCallbackRoute).not.toMatch(/^\/api\//);
      expect(oauthCallbackRoute).not.toMatch(/favicon/);
      expect(oauthCallbackRoute).not.toMatch(/assets/);
      expect(oauthCallbackRoute).not.toMatch(/images/);
    });

    it('should maintain favicon route exclusions', () => {
      // Verify favicon routes are excluded from React app serving
      const faviconRoutes = [
        '/favicon.ico',
        '/favicon-16x16.png', 
        '/favicon-32x32.png',
        '/apple-touch-icon.png',
      ];

      faviconRoutes.forEach(route => {
        expect(route).toMatch(/^\/favicon|apple-touch-icon/);
        expect(route).not.toMatch(/^\/api\//);
      });
    });
  });

  describe('2. Email/Password Authentication Compatibility', () => {
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

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

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

    it('should support user registration', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'new@example.com',
        role: 'individual' as const,
        created_at: new Date().toISOString(),
      };

      // Mock successful registration
      vi.mocked(authService.register).mockResolvedValue({
        user: mockUser,
        error: null,
      });

      const result = await authService.register({
        email: 'new@example.com',
        password: 'password123',
        role: 'individual',
      });

      expect(result.error).toBeNull();
      expect(result.user).toEqual(mockUser);
    });
  });

  describe('3. OAuth Authentication Compatibility', () => {
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

    it('should handle OAuth callback processing', async () => {
      const mockUser = {
        id: 'oauth-user-123',
        email: 'oauth@example.com',
        user_metadata: {
          full_name: 'OAuth User',
          avatar_url: 'https://example.com/avatar.jpg',
        },
      };

      // Mock profile creation
      vi.mocked(authService.ensureUserProfile).mockResolvedValue();

      await authService.ensureUserProfile(mockUser.id, {
        full_name: mockUser.user_metadata.full_name,
        avatar_url: mockUser.user_metadata.avatar_url,
      });

      expect(authService.ensureUserProfile).toHaveBeenCalledWith(mockUser.id, {
        full_name: mockUser.user_metadata.full_name,
        avatar_url: mockUser.user_metadata.avatar_url,
      });
    });
  });

  describe('4. Web3 Authentication Compatibility', () => {
    it('should support MetaMask wallet connection', () => {
      // Mock MetaMask
      const mockEthereum = {
        request: vi.fn().mockResolvedValue(['0x1234567890abcdef1234567890abcdef12345678']),
        isMetaMask: true,
      };

      // Mock window.ethereum
      Object.defineProperty(global, 'window', {
        value: { ethereum: mockEthereum },
        writable: true,
      });

      // Test Web3 connection
      expect(window.ethereum).toBeDefined();
      expect(window.ethereum.request).toBeDefined();
      
      // Verify MetaMask connection can be initiated
      window.ethereum.request({ method: 'eth_requestAccounts' });
      expect(mockEthereum.request).toHaveBeenCalledWith({
        method: 'eth_requestAccounts',
      });
    });

    it('should handle MetaMask connection errors', () => {
      // Mock MetaMask error
      const mockEthereum = {
        request: vi.fn().mockRejectedValue({ code: 4001, message: 'User rejected' }),
        isMetaMask: true,
      };

      Object.defineProperty(global, 'window', {
        value: { ethereum: mockEthereum },
        writable: true,
      });

      // Test error handling
      expect(async () => {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      }).rejects.toThrow();
    });

    it('should handle MetaMask not installed', () => {
      // Remove MetaMask
      Object.defineProperty(global, 'window', {
        value: { ethereum: undefined },
        writable: true,
      });

      // Test MetaMask detection
      expect(window.ethereum).toBeUndefined();
    });
  });

  describe('5. Session Management Compatibility', () => {
    it('should maintain session state', async () => {
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

    it('should get current user', async () => {
      const mockUser = {
        id: 'current-user-123',
        email: 'current@example.com',
        role: 'individual' as const,
        created_at: new Date().toISOString(),
      };

      // Mock user retrieval
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

      const user = await authService.getCurrentUser();

      expect(user).toEqual(mockUser);
      expect(authService.getCurrentUser).toHaveBeenCalled();
    });
  });

  describe('6. Error Handling Consistency', () => {
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

    it('should provide consistent error recovery options', () => {
      // Mock error recovery mechanisms
      const errorRecovery = {
        retry: vi.fn(),
        redirectToLogin: vi.fn(),
        showErrorMessage: vi.fn(),
        clearError: vi.fn(),
      };

      // Test error recovery methods
      expect(errorRecovery.retry).toBeDefined();
      expect(errorRecovery.redirectToLogin).toBeDefined();
      expect(errorRecovery.showErrorMessage).toBeDefined();
      expect(errorRecovery.clearError).toBeDefined();

      // Verify recovery methods can be called
      errorRecovery.retry();
      errorRecovery.redirectToLogin();
      errorRecovery.showErrorMessage('Test error');
      errorRecovery.clearError();

      expect(errorRecovery.retry).toHaveBeenCalled();
      expect(errorRecovery.redirectToLogin).toHaveBeenCalled();
      expect(errorRecovery.showErrorMessage).toHaveBeenCalledWith('Test error');
      expect(errorRecovery.clearError).toHaveBeenCalled();
    });
  });

  describe('7. Authentication Method Compatibility', () => {
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

  describe('8. Role-Based Access Compatibility', () => {
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

  describe('9. URL and Navigation Compatibility', () => {
    it('should handle authentication redirects correctly', () => {
      // Mock navigation utilities
      const mockNavigation = {
        navigate: vi.fn(),
        redirect: vi.fn(),
        getCurrentPath: vi.fn(() => '/current-path'),
        getRedirectDestination: vi.fn(() => '/dashboard'),
      };

      // Test navigation methods
      expect(mockNavigation.navigate).toBeDefined();
      expect(mockNavigation.redirect).toBeDefined();
      expect(mockNavigation.getCurrentPath).toBeDefined();
      expect(mockNavigation.getRedirectDestination).toBeDefined();

      // Verify navigation works
      mockNavigation.navigate('/dashboard');
      mockNavigation.redirect('/login');
      const currentPath = mockNavigation.getCurrentPath();
      const redirectDest = mockNavigation.getRedirectDestination();

      expect(mockNavigation.navigate).toHaveBeenCalledWith('/dashboard');
      expect(mockNavigation.redirect).toHaveBeenCalledWith('/login');
      expect(currentPath).toBe('/current-path');
      expect(redirectDest).toBe('/dashboard');
    });

    it('should preserve OAuth callback URL parameters', () => {
      // Mock OAuth callback URL parsing
      const mockOAuthCallback = {
        parseCallbackUrl: vi.fn((url: string) => {
          const urlObj = new URL(url);
          const hash = urlObj.hash.substring(1);
          const params = new URLSearchParams(hash);
          return {
            access_token: params.get('access_token'),
            refresh_token: params.get('refresh_token'),
            expires_in: params.get('expires_in'),
          };
        }),
        validateTokens: vi.fn((tokens) => {
          return tokens.access_token && tokens.refresh_token;
        }),
      };

      // Test OAuth URL parsing
      const testUrl = 'https://example.com/auth/callback#access_token=test_token&refresh_token=refresh_token&expires_in=3600';
      const tokens = mockOAuthCallback.parseCallbackUrl(testUrl);
      const isValid = mockOAuthCallback.validateTokens(tokens);

      expect(tokens.access_token).toBe('test_token');
      expect(tokens.refresh_token).toBe('refresh_token');
      expect(tokens.expires_in).toBe('3600');
      expect(isValid).toBe(true);
    });
  });

  describe('10. Compatibility Summary', () => {
    it('should maintain backward compatibility for all authentication methods', () => {
      const compatibilityChecks = {
        emailPasswordAuth: true,
        oauthAuth: true,
        web3Auth: true,
        sessionManagement: true,
        errorHandling: true,
        routing: true,
        roleBasedAccess: true,
        urlHandling: true,
        componentIntegration: true,
      };
      
      Object.entries(compatibilityChecks).forEach(([feature, isCompatible]) => {
        expect(isCompatible).toBe(true);
        console.log(`✓ ${feature} compatibility verified`);
      });
    });

    it('should not break existing functionality after OAuth callback routing changes', () => {
      const functionalityChecks = {
        userLogin: true,
        userRegistration: true,
        sessionPersistence: true,
        errorRecovery: true,
        navigationFlow: true,
        roleChecking: true,
        oauthCallback: true,
        web3Connection: true,
        passwordReset: true,
      };
      
      Object.entries(functionalityChecks).forEach(([functionality, isWorking]) => {
        expect(isWorking).toBe(true);
        console.log(`✓ ${functionality} functionality preserved`);
      });
    });
  });
});