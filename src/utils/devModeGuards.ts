/**
 * Development Mode Guards
 * 
 * Provides utilities for:
 * - Environment detection
 * - Development-only feature flags
 * - Production safety checks
 * 
 * Requirements: C13.1, C13.2, C13.3, C13.4, C13.5
 */

import { DebugLogger } from './debugLogger';
import { StateLogger } from './stateLogger';

/**
 * Environment types
 */
export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test',
}

/**
 * Development feature flags
 */
interface DevFeatureFlags {
  verboseLogging: boolean;
  stateInspection: boolean;
  errorOverlays: boolean;
  performanceMonitoring: boolean;
  debugPanel: boolean;
  reactDevTools: boolean;
}

class DevModeGuardsClass {
  private environment: Environment;
  private featureFlags: DevFeatureFlags;
  private globalDebugEnabled: boolean;

  constructor() {
    this.environment = this.detectEnvironment();
    this.featureFlags = this.initializeFeatureFlags();
    this.globalDebugEnabled = false;

    // Expose debug utilities in development
    if (this.isDevelopment()) {
      this.exposeGlobalDebugObject();
    }
  }

  /**
   * Detect the current environment
   */
  private detectEnvironment(): Environment {
    // Check Vite environment variables
    const mode = import.meta.env.MODE;
    const isDev = import.meta.env.DEV;
    const isProd = import.meta.env.PROD;

    // Check for test environment
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
      return Environment.TEST;
    }

    if (mode === 'test' || import.meta.env.VITEST) {
      return Environment.TEST;
    }

    // Check explicit mode setting
    if (mode === 'staging') {
      return Environment.STAGING;
    }

    if (mode === 'production' || isProd) {
      return Environment.PRODUCTION;
    }

    if (mode === 'development' || isDev) {
      return Environment.DEVELOPMENT;
    }

    // Default to production for safety
    return Environment.PRODUCTION;
  }

  /**
   * Initialize feature flags based on environment
   */
  private initializeFeatureFlags(): DevFeatureFlags {
    const isDev = this.environment === Environment.DEVELOPMENT;
    const isTest = this.environment === Environment.TEST;

    return {
      verboseLogging: isDev || isTest,
      stateInspection: isDev,
      errorOverlays: isDev,
      performanceMonitoring: isDev,
      debugPanel: isDev,
      reactDevTools: isDev,
    };
  }

  /**
   * Check if running in development mode
   */
  isDevelopment(): boolean {
    return this.environment === Environment.DEVELOPMENT;
  }

  /**
   * Check if running in production mode
   */
  isProduction(): boolean {
    return this.environment === Environment.PRODUCTION;
  }

  /**
   * Check if running in staging mode
   */
  isStaging(): boolean {
    return this.environment === Environment.STAGING;
  }

  /**
   * Check if running in test mode
   */
  isTest(): boolean {
    return this.environment === Environment.TEST;
  }

  /**
   * Get current environment
   */
  getEnvironment(): Environment {
    return this.environment;
  }

  /**
   * Check if a development feature is enabled
   */
  isFeatureEnabled(feature: keyof DevFeatureFlags): boolean {
    // Always return false in production
    if (this.isProduction()) {
      return false;
    }

    return this.featureFlags[feature];
  }

  /**
   * Enable a development feature
   */
  enableFeature(feature: keyof DevFeatureFlags): void {
    if (this.isProduction()) {
      console.warn('[DevModeGuards] Cannot enable features in production');
      return;
    }

    this.featureFlags[feature] = true;
    console.log(`[DevModeGuards] Feature enabled: ${feature}`);
  }

  /**
   * Disable a development feature
   */
  disableFeature(feature: keyof DevFeatureFlags): void {
    if (this.isProduction()) {
      return;
    }

    this.featureFlags[feature] = false;
    console.log(`[DevModeGuards] Feature disabled: ${feature}`);
  }

  /**
   * Get all feature flags
   */
  getFeatureFlags(): Readonly<DevFeatureFlags> {
    return { ...this.featureFlags };
  }

  /**
   * Execute code only in development
   */
  devOnly<T>(fn: () => T): T | undefined {
    if (this.isDevelopment()) {
      return fn();
    }
    return undefined;
  }

  /**
   * Execute code only in production
   */
  prodOnly<T>(fn: () => T): T | undefined {
    if (this.isProduction()) {
      return fn();
    }
    return undefined;
  }

  /**
   * Execute code only in non-production environments
   */
  nonProdOnly<T>(fn: () => T): T | undefined {
    if (!this.isProduction()) {
      return fn();
    }
    return undefined;
  }

  /**
   * Assert that code is running in development
   */
  assertDevelopment(message?: string): void {
    if (!this.isDevelopment()) {
      throw new Error(
        message || 'This operation is only allowed in development mode'
      );
    }
  }

  /**
   * Assert that code is running in production
   */
  assertProduction(message?: string): void {
    if (!this.isProduction()) {
      throw new Error(
        message || 'This operation is only allowed in production mode'
      );
    }
  }

  /**
   * Expose global debug object for browser console access
   */
  private exposeGlobalDebugObject(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const debugObject = {
      // Environment info
      env: this.environment,
      isDev: this.isDevelopment(),
      isProd: this.isProduction(),

      // Feature flags
      features: this.getFeatureFlags(),
      enableFeature: (feature: keyof DevFeatureFlags) => this.enableFeature(feature),
      disableFeature: (feature: keyof DevFeatureFlags) => this.disableFeature(feature),

      // Debug logger controls
      logger: {
        enable: (namespace: string) => DebugLogger.enable(namespace),
        disable: (namespace: string) => DebugLogger.disable(namespace),
        enableMultiple: (namespaces: string[]) => DebugLogger.enableMultiple(namespaces),
        disableMultiple: (namespaces: string[]) => DebugLogger.disableMultiple(namespaces),
        setLevel: (level: number) => DebugLogger.setLevel(level),
        getLevel: () => DebugLogger.getLevel(),
        enabledNamespaces: () => DebugLogger.getEnabledNamespaces(),
        disabledNamespaces: () => DebugLogger.getDisabledNamespaces(),
      },

      // State logger controls
      state: {
        getHistory: (source: string) => StateLogger.getStateHistory(source),
        getLatest: (source: string) => StateLogger.getLatestState(source),
        clearHistory: (source: string) => StateLogger.clearHistory(source),
        clearAll: () => StateLogger.clearAllHistory(),
      },

      // Utility functions
      enableVerboseLogging: () => {
        this.enableFeature('verboseLogging');
        DebugLogger.enableMultiple(['*']);
        console.log('[DevModeGuards] Verbose logging enabled for all namespaces');
      },

      disableVerboseLogging: () => {
        this.disableFeature('verboseLogging');
        DebugLogger.clearNamespaces();
        console.log('[DevModeGuards] Verbose logging disabled');
      },

      help: () => {
        console.log(`
🛠️  Gang Green Platform - Development Debug Tools

Environment: ${this.environment}

Available Commands:
  __GGDEBUG__.enableVerboseLogging()     - Enable verbose logging for all namespaces
  __GGDEBUG__.disableVerboseLogging()    - Disable verbose logging
  __GGDEBUG__.logger.enable('namespace') - Enable logging for specific namespace
  __GGDEBUG__.logger.disable('namespace')- Disable logging for specific namespace
  __GGDEBUG__.logger.setLevel(level)     - Set log level (0=DEBUG, 1=INFO, 2=WARN, 3=ERROR)
  __GGDEBUG__.state.getHistory('source') - Get state history for a source
  __GGDEBUG__.state.getLatest('source')  - Get latest state for a source
  __GGDEBUG__.features                   - View current feature flags
  __GGDEBUG__.enableFeature('feature')   - Enable a development feature
  __GGDEBUG__.help()                     - Show this help message

Feature Flags:
${Object.entries(this.featureFlags)
  .map(([key, value]) => `  - ${key}: ${value}`)
  .join('\n')}

Common Namespaces:
  - auth:*          - Authentication operations
  - api:*           - API calls
  - state:*         - State changes
  - curation:*      - Content curation
  - error:*         - Error handling
  - perf:*          - Performance measurements
        `);
      },
    };

    // Expose to window
    (window as any).__GGDEBUG__ = debugObject;

    console.log(
      '%c🛠️  Gang Green Platform - Development Mode',
      'color: #10b981; font-size: 14px; font-weight: bold;'
    );
    console.log(
      '%cDebug tools available at: __GGDEBUG__',
      'color: #6366f1; font-size: 12px;'
    );
    console.log(
      '%cType __GGDEBUG__.help() for available commands',
      'color: #8b5cf6; font-size: 12px;'
    );
  }

  /**
   * Enable verbose logging from browser console
   */
  enableVerboseLogging(): void {
    if (!this.isDevelopment()) {
      console.warn('[DevModeGuards] Verbose logging only available in development');
      return;
    }

    this.globalDebugEnabled = true;
    this.enableFeature('verboseLogging');
    DebugLogger.enableMultiple(['*']);
  }

  /**
   * Disable verbose logging
   */
  disableVerboseLogging(): void {
    this.globalDebugEnabled = false;
    this.disableFeature('verboseLogging');
    DebugLogger.clearNamespaces();
  }

  /**
   * Check if verbose logging is enabled
   */
  isVerboseLoggingEnabled(): boolean {
    return this.globalDebugEnabled;
  }

  /**
   * Get build information
   */
  getBuildInfo(): {
    environment: Environment;
    mode: string;
    isDev: boolean;
    isProd: boolean;
    version?: string;
  } {
    return {
      environment: this.environment,
      mode: import.meta.env.MODE,
      isDev: import.meta.env.DEV,
      isProd: import.meta.env.PROD,
      version: import.meta.env.VITE_APP_VERSION,
    };
  }

  /**
   * Log build information
   */
  logBuildInfo(): void {
    const info = this.getBuildInfo();
    console.log('[DevModeGuards] Build Information:', info);
  }
}

// Export singleton instance
export const DevModeGuards = new DevModeGuardsClass();

// Export for testing
export { DevModeGuardsClass };

/**
 * Decorator for development-only methods
 */
export function devOnly(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    if (DevModeGuards.isDevelopment()) {
      return originalMethod.apply(this, args);
    }
    console.warn(`[DevModeGuards] Method ${propertyKey} is only available in development`);
    return undefined;
  };

  return descriptor;
}

/**
 * Decorator for production-only methods
 */
export function prodOnly(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    if (DevModeGuards.isProduction()) {
      return originalMethod.apply(this, args);
    }
    console.warn(`[DevModeGuards] Method ${propertyKey} is only available in production`);
    return undefined;
  };

  return descriptor;
}
