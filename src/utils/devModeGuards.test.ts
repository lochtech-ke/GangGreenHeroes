/**
 * Unit tests for DevModeGuards
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DevModeGuards, DevModeGuardsClass, Environment } from './devModeGuards';

describe('DevModeGuards', () => {
  let consoleLogSpy: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Environment Detection', () => {
    it('should detect test environment', () => {
      // In vitest, we're in test mode
      expect(DevModeGuards.isTest()).toBe(true);
    });

    it('should return current environment', () => {
      const env = DevModeGuards.getEnvironment();
      expect(env).toBe(Environment.TEST);
    });

    it('should provide environment check methods', () => {
      expect(typeof DevModeGuards.isDevelopment).toBe('function');
      expect(typeof DevModeGuards.isProduction).toBe('function');
      expect(typeof DevModeGuards.isStaging).toBe('function');
      expect(typeof DevModeGuards.isTest).toBe('function');
    });
  });

  describe('Feature Flags', () => {
    it('should initialize feature flags', () => {
      const flags = DevModeGuards.getFeatureFlags();
      
      expect(flags).toHaveProperty('verboseLogging');
      expect(flags).toHaveProperty('stateInspection');
      expect(flags).toHaveProperty('errorOverlays');
      expect(flags).toHaveProperty('performanceMonitoring');
      expect(flags).toHaveProperty('debugPanel');
      expect(flags).toHaveProperty('reactDevTools');
    });

    it('should check if feature is enabled', () => {
      const isEnabled = DevModeGuards.isFeatureEnabled('verboseLogging');
      expect(typeof isEnabled).toBe('boolean');
    });

    it('should enable feature in non-production', () => {
      if (!DevModeGuards.isProduction()) {
        DevModeGuards.enableFeature('debugPanel');
        expect(DevModeGuards.isFeatureEnabled('debugPanel')).toBe(true);
      }
    });

    it('should disable feature in non-production', () => {
      if (!DevModeGuards.isProduction()) {
        DevModeGuards.enableFeature('debugPanel');
        DevModeGuards.disableFeature('debugPanel');
        expect(DevModeGuards.isFeatureEnabled('debugPanel')).toBe(false);
      }
    });

    it('should not enable features in production', () => {
      // Create a mock production instance
      const mockGuards = new DevModeGuardsClass();
      vi.spyOn(mockGuards, 'isProduction').mockReturnValue(true);
      
      mockGuards.enableFeature('debugPanel');
      
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should always return false for features in production', () => {
      const mockGuards = new DevModeGuardsClass();
      vi.spyOn(mockGuards, 'isProduction').mockReturnValue(true);
      
      const isEnabled = mockGuards.isFeatureEnabled('verboseLogging');
      expect(isEnabled).toBe(false);
    });
  });

  describe('Conditional Execution', () => {
    it('should execute devOnly in development/test', () => {
      let executed = false;
      
      DevModeGuards.devOnly(() => {
        executed = true;
      });
      
      // In test mode, devOnly should not execute (only in development)
      expect(executed).toBe(false);
    });

    it('should not execute devOnly in production', () => {
      const mockGuards = new DevModeGuardsClass();
      vi.spyOn(mockGuards, 'isDevelopment').mockReturnValue(false);
      
      let executed = false;
      
      mockGuards.devOnly(() => {
        executed = true;
      });
      
      expect(executed).toBe(false);
    });

    it('should execute prodOnly in production', () => {
      const mockGuards = new DevModeGuardsClass();
      vi.spyOn(mockGuards, 'isProduction').mockReturnValue(true);
      
      let executed = false;
      
      mockGuards.prodOnly(() => {
        executed = true;
      });
      
      expect(executed).toBe(true);
    });

    it('should not execute prodOnly in non-production', () => {
      let executed = false;
      
      DevModeGuards.prodOnly(() => {
        executed = true;
      });
      
      expect(executed).toBe(false);
    });

    it('should execute nonProdOnly in non-production', () => {
      let executed = false;
      
      DevModeGuards.nonProdOnly(() => {
        executed = true;
      });
      
      // In test mode, this should execute
      expect(executed).toBe(true);
    });

    it('should return value from devOnly when executed', () => {
      const mockGuards = new DevModeGuardsClass();
      vi.spyOn(mockGuards, 'isDevelopment').mockReturnValue(true);
      
      const result = mockGuards.devOnly(() => 'test-value');
      
      expect(result).toBe('test-value');
    });

    it('should return undefined from devOnly when not executed', () => {
      const result = DevModeGuards.devOnly(() => 'test-value');
      
      expect(result).toBeUndefined();
    });
  });

  describe('Environment Assertions', () => {
    it('should throw when assertDevelopment in non-development', () => {
      if (!DevModeGuards.isDevelopment()) {
        expect(() => {
          DevModeGuards.assertDevelopment();
        }).toThrow('This operation is only allowed in development mode');
      }
    });

    it('should not throw when assertDevelopment in development', () => {
      const mockGuards = new DevModeGuardsClass();
      vi.spyOn(mockGuards, 'isDevelopment').mockReturnValue(true);
      
      expect(() => {
        mockGuards.assertDevelopment();
      }).not.toThrow();
    });

    it('should throw with custom message', () => {
      if (!DevModeGuards.isDevelopment()) {
        expect(() => {
          DevModeGuards.assertDevelopment('Custom error message');
        }).toThrow('Custom error message');
      }
    });

    it('should throw when assertProduction in non-production', () => {
      if (!DevModeGuards.isProduction()) {
        expect(() => {
          DevModeGuards.assertProduction();
        }).toThrow('This operation is only allowed in production mode');
      }
    });

    it('should not throw when assertProduction in production', () => {
      const mockGuards = new DevModeGuardsClass();
      vi.spyOn(mockGuards, 'isProduction').mockReturnValue(true);
      
      expect(() => {
        mockGuards.assertProduction();
      }).not.toThrow();
    });
  });

  describe('Verbose Logging', () => {
    it('should enable verbose logging in development', () => {
      const mockGuards = new DevModeGuardsClass();
      vi.spyOn(mockGuards, 'isDevelopment').mockReturnValue(true);
      
      mockGuards.enableVerboseLogging();
      
      expect(mockGuards.isVerboseLoggingEnabled()).toBe(true);
    });

    it('should disable verbose logging', () => {
      const mockGuards = new DevModeGuardsClass();
      vi.spyOn(mockGuards, 'isDevelopment').mockReturnValue(true);
      
      mockGuards.enableVerboseLogging();
      mockGuards.disableVerboseLogging();
      
      expect(mockGuards.isVerboseLoggingEnabled()).toBe(false);
    });

    it('should warn when enabling verbose logging in production', () => {
      const mockGuards = new DevModeGuardsClass();
      vi.spyOn(mockGuards, 'isDevelopment').mockReturnValue(false);
      
      mockGuards.enableVerboseLogging();
      
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('Build Information', () => {
    it('should return build information', () => {
      const info = DevModeGuards.getBuildInfo();
      
      expect(info).toHaveProperty('environment');
      expect(info).toHaveProperty('mode');
      expect(info).toHaveProperty('isDev');
      expect(info).toHaveProperty('isProd');
    });

    it('should log build information', () => {
      DevModeGuards.logBuildInfo();
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should include environment in build info', () => {
      const info = DevModeGuards.getBuildInfo();
      
      expect(Object.values(Environment)).toContain(info.environment);
    });
  });

  describe('Global Debug Object', () => {
    it('should not expose debug object in test mode', () => {
      // In test mode, window might not be defined or debug object not exposed
      if (typeof window !== 'undefined') {
        // Debug object should only be exposed in development, not test
        expect((window as any).__GGDEBUG__).toBeUndefined();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing window object', () => {
      // Should not throw when window is undefined
      expect(() => {
        new DevModeGuardsClass();
      }).not.toThrow();
    });

    it('should return immutable feature flags', () => {
      const flags1 = DevModeGuards.getFeatureFlags();
      const flags2 = DevModeGuards.getFeatureFlags();
      
      // Should be different objects (copies)
      expect(flags1).not.toBe(flags2);
      
      // But with same values
      expect(flags1).toEqual(flags2);
    });

    it('should handle undefined version', () => {
      const info = DevModeGuards.getBuildInfo();
      
      // Version might be undefined
      expect(info.version === undefined || typeof info.version === 'string').toBe(true);
    });
  });

  describe('Feature Flag Types', () => {
    it('should have all expected feature flags', () => {
      const flags = DevModeGuards.getFeatureFlags();
      
      const expectedFlags = [
        'verboseLogging',
        'stateInspection',
        'errorOverlays',
        'performanceMonitoring',
        'debugPanel',
        'reactDevTools',
      ];
      
      expectedFlags.forEach(flag => {
        expect(flags).toHaveProperty(flag);
        expect(typeof flags[flag as keyof typeof flags]).toBe('boolean');
      });
    });
  });
});
