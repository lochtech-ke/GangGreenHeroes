import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './auth.service';
import { supabase } from './supabase';
import { hummingbirdBadgeService } from './hummingbirdBadge.service';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Mock Hummingbird Badge Service
vi.mock('./hummingbirdBadge.service', () => ({
  hummingbirdBadgeService: {
    createDefaultHummingbirdConfig: vi.fn(),
    generateHummingbirdBadge: vi.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'individual' as const,
      };

      const mockAuthData = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      // Mock signUp
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: mockAuthData,
        error: null,
      } as any);

      // Mock database inserts and queries
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
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

      // Mock getCurrentUser
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockAuthData.user },
        error: null,
      } as any);

      // Mock hummingbird badge service
      const mockBadgeConfig = {
        id: 'hummingbird-welcome-user-123',
        tier: 'bronze',
        forest: 'kakamega',
        achievement: 'welcome_badge',
        metadata: {
          badgeName: 'Hummingbird Welcome Badge',
          userId: 'user-123',
        },
      };

      vi.mocked(hummingbirdBadgeService.createDefaultHummingbirdConfig).mockReturnValue(mockBadgeConfig as any);
      vi.mocked(hummingbirdBadgeService.generateHummingbirdBadge).mockResolvedValue({
        success: true,
        svg: '<svg>mock badge</svg>',
        metadata: mockBadgeConfig.metadata as any,
      });

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
        role: 'individual',
        forest_preference: 'kakamega',
      });

      expect(result.error).toBeNull();
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            role: 'individual',
            forest_preference: 'kakamega',
          },
        },
      });

      // Verify badge generation was called
      expect(hummingbirdBadgeService.createDefaultHummingbirdConfig).toHaveBeenCalledWith(
        'user-123',
        'bronze',
        'kakamega'
      );
      expect(hummingbirdBadgeService.generateHummingbirdBadge).toHaveBeenCalledWith(mockBadgeConfig);
    });

    it('should return error when registration fails', async () => {
      const mockError = new Error('Registration failed');

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      } as any);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
        role: 'individual',
      });

      expect(result.error).toBeInstanceOf(Error);
      expect(result.user).toBeNull();
    });

    it('should handle badge generation failure gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'individual' as const,
      };

      const mockAuthData = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      // Mock successful auth
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: mockAuthData,
        error: null,
      } as any);

      // Mock database operations
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
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
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockAuthData.user },
        error: null,
      } as any);

      // Mock badge generation failure
      vi.mocked(hummingbirdBadgeService.createDefaultHummingbirdConfig).mockImplementation(() => {
        throw new Error('Badge generation failed');
      });

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
        role: 'individual',
      });

      // Registration should still succeed even if badge generation fails
      expect(result.error).toBeNull();
      expect(result.user).toBeTruthy();
    });

    it('should create user account before attempting badge generation (Req 5.1)', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'individual' as const,
      };

      const mockAuthData = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      const callOrder: string[] = [];

      // Mock signUp to track when user is created
      vi.mocked(supabase.auth.signUp).mockImplementation(async () => {
        callOrder.push('user-created');
        return {
          data: mockAuthData,
          error: null,
        } as any;
      });

      // Mock database operations
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
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
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockAuthData.user },
        error: null,
      } as any);

      // Mock badge generation to track when it's called
      vi.mocked(hummingbirdBadgeService.createDefaultHummingbirdConfig).mockImplementation(() => {
        callOrder.push('badge-generation');
        return {} as any;
      });

      vi.mocked(hummingbirdBadgeService.generateHummingbirdBadge).mockResolvedValue({
        success: true,
        svg: '<svg>badge</svg>',
        metadata: {},
      });

      await authService.register({
        email: 'test@example.com',
        password: 'password123',
        role: 'individual',
      });

      // Verify user creation happens before badge generation
      expect(callOrder[0]).toBe('user-created');
      expect(callOrder[1]).toBe('badge-generation');
    });

    it('should create fallback notification when badge generation fails (Req 5.3)', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'individual' as const,
      };

      const mockAuthData = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      let fallbackNotificationCreated = false;

      // Mock successful auth
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: mockAuthData,
        error: null,
      } as any);

      // Mock database operations - track fallback notification
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'notifications') {
          return {
            insert: vi.fn().mockImplementation((data: any) => {
              if (data.type === 'welcome' && data.metadata?.is_fallback) {
                fallbackNotificationCreated = true;
              }
              return Promise.resolve({ data: null, error: null });
            }),
          };
        }
        return {
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
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
        };
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockAuthData.user },
        error: null,
      } as any);

      // Mock badge generation failure
      vi.mocked(hummingbirdBadgeService.createDefaultHummingbirdConfig).mockImplementation(() => {
        throw new Error('Badge generation failed');
      });

      await authService.register({
        email: 'test@example.com',
        password: 'password123',
        role: 'individual',
      });

      // Verify fallback notification was created
      expect(fallbackNotificationCreated).toBe(true);
    });

    it('should return user object regardless of badge generation status (Req 5.4)', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'individual' as const,
      };

      const mockAuthData = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      // Mock successful auth
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: mockAuthData,
        error: null,
      } as any);

      // Mock database operations
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
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
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockAuthData.user },
        error: null,
      } as any);

      // Test with badge generation failure
      vi.mocked(hummingbirdBadgeService.createDefaultHummingbirdConfig).mockImplementation(() => {
        throw new Error('Badge generation failed');
      });

      const resultWithFailure = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        role: 'individual',
      });

      expect(resultWithFailure.error).toBeNull();
      expect(resultWithFailure.user).toBeTruthy();
      expect(resultWithFailure.user?.id).toBe('user-123');

      // Test with badge generation success
      vi.mocked(hummingbirdBadgeService.createDefaultHummingbirdConfig).mockReturnValue({} as any);
      vi.mocked(hummingbirdBadgeService.generateHummingbirdBadge).mockResolvedValue({
        success: true,
        svg: '<svg>badge</svg>',
        metadata: {},
      });

      const resultWithSuccess = await authService.register({
        email: 'test2@example.com',
        password: 'password123',
        role: 'individual',
      });

      expect(resultWithSuccess.error).toBeNull();
      expect(resultWithSuccess.user).toBeTruthy();
      expect(resultWithSuccess.user?.id).toBe('user-123');
    });

    it('should create both badge and notification on success path (Req 5.5)', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'individual' as const,
      };

      const mockAuthData = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      let badgeCreated = false;
      let notificationCreated = false;

      // Mock successful auth
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: mockAuthData,
        error: null,
      } as any);

      // Mock database operations - track badge and notification creation
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'nft_badges') {
          return {
            insert: vi.fn().mockImplementation(() => {
              badgeCreated = true;
              return Promise.resolve({ data: null, error: null });
            }),
          };
        }
        if (table === 'notifications') {
          return {
            insert: vi.fn().mockImplementation((data: any) => {
              if (data.type === 'badge_earned') {
                notificationCreated = true;
              }
              return Promise.resolve({ data: null, error: null });
            }),
          };
        }
        return {
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
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
        };
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockAuthData.user },
        error: null,
      } as any);

      // Mock successful badge generation
      vi.mocked(hummingbirdBadgeService.createDefaultHummingbirdConfig).mockReturnValue({} as any);
      vi.mocked(hummingbirdBadgeService.generateHummingbirdBadge).mockResolvedValue({
        success: true,
        svg: '<svg>badge</svg>',
        metadata: {},
      });

      await authService.register({
        email: 'test@example.com',
        password: 'password123',
        role: 'individual',
        forest_preference: 'kakamega',
      });

      // Verify both badge and notification were created
      expect(badgeCreated).toBe(true);
      expect(notificationCreated).toBe(true);
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'individual' as const,
        created_at: new Date().toISOString(),
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: {} as any,
        },
        error: null,
      } as any);

      // Mock database queries
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUser,
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      } as any);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.error).toBeNull();
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should return error when login fails', async () => {
      const mockError = new Error('Invalid credentials');

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      } as any);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Invalid');
      expect(result.user).toBeNull();
    });
  });

  describe('logout', () => {
    it('should successfully logout a user', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      const result = await authService.logout();

      expect(result.error).toBeNull();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('requestPasswordReset', () => {
    it('should send password reset email', async () => {
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
  });

  describe('role checking', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'admin' as const,
      created_at: new Date().toISOString(),
    };

    it('should correctly check if user has specific role', () => {
      expect(authService.hasRole(mockUser, 'admin')).toBe(true);
      expect(authService.hasRole(mockUser, 'organization')).toBe(false);
    });

    it('should correctly check if user has any of specified roles', () => {
      expect(authService.hasAnyRole(mockUser, ['admin', 'organization'])).toBe(true);
      expect(authService.hasAnyRole(mockUser, ['community', 'individual'])).toBe(false);
    });

    it('should correctly identify admin users', () => {
      expect(authService.isAdmin(mockUser)).toBe(true);
      expect(authService.isAdmin({ ...mockUser, role: 'individual' })).toBe(false);
    });

    it('should correctly identify organization users', () => {
      const orgUser = { ...mockUser, role: 'organization' as const };
      expect(authService.isOrganization(orgUser)).toBe(true);
      expect(authService.isOrganization(mockUser)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(authService.hasRole(null, 'admin')).toBe(false);
      expect(authService.hasAnyRole(null, ['admin'])).toBe(false);
      expect(authService.isAdmin(null)).toBe(false);
      expect(authService.isOrganization(null)).toBe(false);
    });
  });

  describe('background health check behavior (Task 7)', () => {
    it('should log health check results without affecting login operation (Req 1.5, 2.3)', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'individual' as const,
        created_at: new Date().toISOString(),
      };

      const consoleSpy = vi.spyOn(console, 'log');
      const consoleWarnSpy = vi.spyOn(console, 'warn');

      // Mock login to succeed
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: {} as any,
        },
        error: null,
      } as any);

      // Mock health check to complete after a delay
      vi.mocked(supabase.auth.getSession).mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ data: { session: null }, error: null } as any);
          }, 100); // Delay health check completion
        });
      });

      // Mock database queries
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
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      } as any);

      // Perform login
      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // Login should succeed immediately
      expect(result.error).toBeNull();
      expect(result.user).toBeTruthy();

      // Wait for health check to complete
      await new Promise(resolve => setTimeout(resolve, 150));

      // Verify health check was logged (background check)
      const healthCheckLogs = consoleSpy.mock.calls.filter(call => 
        call.some(arg => typeof arg === 'string' && arg.includes('[Health]'))
      );
      expect(healthCheckLogs.length).toBeGreaterThan(0);

      consoleSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should complete login independently of health check timing', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'individual' as const,
        created_at: new Date().toISOString(),
      };

      // Mock login to succeed quickly
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: {} as any,
        },
        error: null,
      } as any);

      // Mock health check with various delays
      const delays = [50, 200, 500];
      
      for (const delay of delays) {
        vi.mocked(supabase.auth.getSession).mockImplementation(() => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({ data: { session: null }, error: null } as any);
            }, delay);
          });
        });

        // Mock database queries
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
        vi.mocked(supabase.auth.getUser).mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null,
        } as any);

        const startTime = Date.now();
        const result = await authService.login({
          email: 'test@example.com',
          password: 'password123',
        });
        const loginDuration = Date.now() - startTime;

        // Login should complete quickly, not waiting for health check
        expect(result.error).toBeNull();
        expect(result.user).toBeTruthy();
        expect(loginDuration).toBeLessThan(delay); // Login completes before health check
      }
    });

    it('should handle health check failure without affecting login success', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'individual' as const,
        created_at: new Date().toISOString(),
      };

      const consoleWarnSpy = vi.spyOn(console, 'warn');

      // Mock login to succeed
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: {} as any,
        },
        error: null,
      } as any);

      // Mock health check to fail
      vi.mocked(supabase.auth.getSession).mockRejectedValue(
        new Error('Health check failed')
      );

      // Mock database queries
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
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      } as any);

      // Perform login
      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // Login should succeed despite health check failure
      expect(result.error).toBeNull();
      expect(result.user).toBeTruthy();

      // Wait for health check to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify health check error was logged
      const healthCheckWarnings = consoleWarnSpy.mock.calls.filter(call =>
        call.some(arg => typeof arg === 'string' && arg.includes('[AuthService]') && arg.includes('Health check'))
      );
      expect(healthCheckWarnings.length).toBeGreaterThan(0);

      consoleWarnSpy.mockRestore();
    });

    it('should not block registration with background health check', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'individual' as const,
      };

      const mockAuthData = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      // Mock signUp to succeed
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: mockAuthData,
        error: null,
      } as any);

      // Mock health check with delay
      vi.mocked(supabase.auth.getSession).mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ data: { session: null }, error: null } as any);
          }, 200);
        });
      });

      // Mock database operations
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
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
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockAuthData.user },
        error: null,
      } as any);

      // Mock badge generation
      vi.mocked(hummingbirdBadgeService.createDefaultHummingbirdConfig).mockReturnValue({} as any);
      vi.mocked(hummingbirdBadgeService.generateHummingbirdBadge).mockResolvedValue({
        success: true,
        svg: '<svg>badge</svg>',
        metadata: {} as any,
      });

      const startTime = Date.now();
      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        role: 'individual',
      });
      const registrationDuration = Date.now() - startTime;

      // Registration should complete without waiting for health check
      expect(result.error).toBeNull();
      expect(result.user).toBeTruthy();
      expect(registrationDuration).toBeLessThan(200); // Completes before health check delay
    });
  });
});
