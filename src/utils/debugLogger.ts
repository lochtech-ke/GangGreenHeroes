/**
 * Debug Logger System
 * Enhanced logging with namespace filtering, color coding, and timing utilities
 * Requirements: 2.1, 2.2, 2.4
 */

import { 
  DebugLogger as IDebugLogger, 
  LogLevel
} from '../types/errors';
interface TimingEntry {
  label: string;
  startTime: number;
}

interface DebugLoggerConfig {
  level: LogLevel;
  enabledNamespaces: Set<string>;
  disabledNamespaces: Set<string>;
  colorEnabled: boolean;
}

/**
 * Debug Logger Implementation
 * Provides structured logging with namespace filtering and color-coded output
 */
export class DebugLogger implements IDebugLogger {
  private config: DebugLoggerConfig;
  private timings: Map<string, TimingEntry>;

  // ANSI color codes for console output
  private readonly colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    
    // Foreground colors
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    
    // Background colors
    bgRed: '\x1b[41m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
  };

  constructor() {
    this.config = {
      level: this.isDevelopment() ? LogLevel.DEBUG : LogLevel.WARN,
      enabledNamespaces: new Set<string>(),
      disabledNamespaces: new Set<string>(),
      colorEnabled: true,
    };
    this.timings = new Map();
  }

  /**
   * Check if running in development mode
   */
  private isDevelopment(): boolean {
    return import.meta.env.DEV || import.meta.env.MODE === 'development';
  }

  /**
   * Check if running in production mode
   */
  private isProduction(): boolean {
    return import.meta.env.PROD || import.meta.env.MODE === 'production';
  }

  /**
   * Execute function only in development mode
   */
  private devOnly<T>(fn: () => T): T | undefined {
    if (this.isDevelopment()) {
      return fn();
    }
    return undefined;
  }

  /**
   * Check if a namespace is enabled for logging
   */
  private isNamespaceEnabled(namespace: string): boolean {
    // If no namespaces are explicitly enabled, all are enabled by default
    const hasEnabledNamespaces = this.config.enabledNamespaces.size > 0;
    
    // Check if explicitly disabled
    if (this.config.disabledNamespaces.has(namespace)) {
      return false;
    }
    
    // Check if explicitly enabled or if no filters are set
    if (!hasEnabledNamespaces || this.config.enabledNamespaces.has(namespace)) {
      return true;
    }
    
    // Check for wildcard patterns (e.g., "auth:*" matches "auth:login", "auth:register")
    for (const pattern of this.config.enabledNamespaces) {
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        if (namespace.startsWith(prefix)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  /**
   * Format a log message with color coding
   */
  private formatMessage(
    level: LogLevel,
    namespace: string,
    message: string
  ): string {
    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level];
    
    if (!this.config.colorEnabled) {
      return `[${timestamp}] [${levelStr}] [${namespace}] ${message}`;
    }

    // Color-code by log level
    let levelColor = this.colors.white;
    switch (level) {
      case LogLevel.DEBUG:
        levelColor = this.colors.cyan;
        break;
      case LogLevel.INFO:
        levelColor = this.colors.green;
        break;
      case LogLevel.WARN:
        levelColor = this.colors.yellow;
        break;
      case LogLevel.ERROR:
        levelColor = this.colors.red + this.colors.bright;
        break;
    }

    const formattedLevel = `${levelColor}${levelStr}${this.colors.reset}`;
    const formattedNamespace = `${this.colors.magenta}${namespace}${this.colors.reset}`;
    const formattedTimestamp = `${this.colors.dim}${timestamp}${this.colors.reset}`;
    
    return `${formattedTimestamp} ${formattedLevel} ${formattedNamespace} ${message}`;
  }

  /**
   * Log a debug message (development only)
   */
  debug(namespace: string, message: string, data?: any): void {
    this.devOnly(() => {
      if (!this.shouldLog(LogLevel.DEBUG) || !this.isNamespaceEnabled(namespace)) {
        return;
      }

      const formatted = this.formatMessage(LogLevel.DEBUG, namespace, message);
      console.log(formatted);
      
      if (data !== undefined) {
        console.log(data);
      }
    });
  }

  /**
   * Log an info message
   */
  info(namespace: string, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO) || !this.isNamespaceEnabled(namespace)) {
      return;
    }

    const formatted = this.formatMessage(LogLevel.INFO, namespace, message);
    console.log(formatted);
    
    if (data !== undefined) {
      console.log(data);
    }
  }

  /**
   * Log a warning message
   */
  warn(namespace: string, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.WARN) || !this.isNamespaceEnabled(namespace)) {
      return;
    }

    const formatted = this.formatMessage(LogLevel.WARN, namespace, message);
    console.warn(formatted);
    
    if (data !== undefined) {
      console.warn(data);
    }
  }

  /**
   * Log an error message
   */
  error(namespace: string, message: string, error?: Error, data?: any): void {
    if (!this.shouldLog(LogLevel.ERROR) || !this.isNamespaceEnabled(namespace)) {
      return;
    }

    const formatted = this.formatMessage(LogLevel.ERROR, namespace, message);
    console.error(formatted);
    
    if (error) {
      console.error(error);
    }
    
    if (data !== undefined) {
      console.error(data);
    }
  }

  /**
   * Start a timing measurement
   */
  time(namespace: string, label: string): void {
    if (!this.isNamespaceEnabled(namespace)) {
      return;
    }

    const key = `${namespace}:${label}`;
    this.timings.set(key, {
      label,
      startTime: performance.now(),
    });

    this.debug(namespace, `⏱️  Timer started: ${label}`);
  }

  /**
   * End a timing measurement and log the duration
   */
  timeEnd(namespace: string, label: string): void {
    if (!this.isNamespaceEnabled(namespace)) {
      return;
    }

    const key = `${namespace}:${label}`;
    const timing = this.timings.get(key);

    if (!timing) {
      this.warn(namespace, `⏱️  Timer not found: ${label}`);
      return;
    }

    const duration = performance.now() - timing.startTime;
    this.timings.delete(key);

    // Color-code based on duration
    let durationColor = this.colors.green;
    if (duration > 1000) {
      durationColor = this.colors.red;
    } else if (duration > 500) {
      durationColor = this.colors.yellow;
    }

    const formattedDuration = this.config.colorEnabled
      ? `${durationColor}${duration.toFixed(2)}ms${this.colors.reset}`
      : `${duration.toFixed(2)}ms`;

    this.info(namespace, `⏱️  ${label}: ${formattedDuration}`);
  }

  /**
   * Enable a namespace for logging
   */
  enable(namespace: string): void {
    this.config.enabledNamespaces.add(namespace);
    this.config.disabledNamespaces.delete(namespace);
  }

  /**
   * Disable a namespace from logging
   */
  disable(namespace: string): void {
    this.config.disabledNamespaces.add(namespace);
    this.config.enabledNamespaces.delete(namespace);
  }

  /**
   * Set the log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Check if a namespace is enabled
   */
  isEnabled(namespace: string): boolean {
    return this.isNamespaceEnabled(namespace);
  }

  /**
   * Get list of enabled namespaces
   */
  getEnabledNamespaces(): string[] {
    return Array.from(this.config.enabledNamespaces);
  }

  /**
   * Log state snapshot (development only)
   */
  logState(namespace: string, state: any): void {
    this.devOnly(() => {
      if (!this.isNamespaceEnabled(namespace)) {
        return;
      }

      this.debug(namespace, '📊 State snapshot:', state);
    });
  }

  /**
   * Log Redux/Context state with sanitization (development only)
   */
  logReduxState(namespace: string, state: any, actionType?: string): void {
    this.devOnly(() => {
      if (!this.isNamespaceEnabled(namespace)) {
        return;
      }

      const message = actionType 
        ? `🔄 Redux action: ${actionType}` 
        : '🏪 Redux state snapshot';
      
      // Sanitize state to avoid logging sensitive data
      const sanitizedState = this.sanitizeStateForLogging(state);
      this.debug(namespace, message, sanitizedState);
    });
  }

  /**
   * Log React Context state (development only)
   */
  logContextState(namespace: string, contextName: string, state: any): void {
    this.devOnly(() => {
      if (!this.isNamespaceEnabled(namespace)) {
        return;
      }

      const sanitizedState = this.sanitizeStateForLogging(state);
      this.debug(namespace, `⚛️  Context [${contextName}]:`, sanitizedState);
    });
  }

  /**
   * Log performance timing for operations
   */
  logPerformance(namespace: string, operation: string, duration: number, metadata?: any): void {
    if (!this.isNamespaceEnabled(namespace)) {
      return;
    }

    // Color-code based on duration
    let performanceLevel = LogLevel.INFO;
    let icon = '⚡';
    
    if (duration > 1000) {
      performanceLevel = LogLevel.WARN;
      icon = '🐌';
    } else if (duration > 500) {
      performanceLevel = LogLevel.WARN;
      icon = '⚠️';
    }

    const message = `${icon} Performance: ${operation} took ${duration.toFixed(2)}ms`;
    
    if (performanceLevel === LogLevel.WARN) {
      this.warn(namespace, message, metadata);
    } else {
      this.info(namespace, message, metadata);
    }
  }

  /**
   * Log component render performance (development only)
   */
  logComponentRender(namespace: string, componentName: string, renderTime: number, props?: any): void {
    this.devOnly(() => {
      if (!this.isNamespaceEnabled(namespace)) {
        return;
      }

      const sanitizedProps = props ? this.sanitizeStateForLogging(props) : undefined;
      this.logPerformance(namespace, `${componentName} render`, renderTime, {
        component: componentName,
        props: sanitizedProps
      });
    });
  }

  /**
   * Log API call performance
   */
  logApiCall(namespace: string, method: string, url: string, duration: number, status?: number): void {
    if (!this.isNamespaceEnabled(namespace)) {
      return;
    }

    const statusIcon = status && status >= 400 ? '❌' : '✅';
    const message = `${statusIcon} API ${method.toUpperCase()} ${url} - ${duration.toFixed(2)}ms`;
    
    const metadata = {
      method,
      url,
      duration,
      status
    };

    if (status && status >= 400) {
      this.warn(namespace, message, metadata);
    } else if (duration > 2000) {
      this.warn(namespace, message, metadata);
    } else {
      this.info(namespace, message, metadata);
    }
  }

  /**
   * Sanitize state object for logging (remove sensitive data)
   */
  private sanitizeStateForLogging(state: any): any {
    if (!state || typeof state !== 'object') {
      return state;
    }

    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'auth', 'credential',
      'privateKey', 'accessToken', 'refreshToken', 'sessionId',
      'apiKey', 'authToken', 'jwt', 'bearer'
    ];

    const sanitize = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }

      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        
        for (const [key, value] of Object.entries(obj)) {
          const lowerKey = key.toLowerCase();
          const isSensitive = sensitiveKeys.some(sensitiveKey => 
            lowerKey.includes(sensitiveKey)
          );

          if (isSensitive) {
            sanitized[key] = '[REDACTED]';
          } else if (typeof value === 'object') {
            sanitized[key] = sanitize(value);
          } else {
            sanitized[key] = value;
          }
        }
        
        return sanitized;
      }

      return obj;
    };

    return sanitize(state);
  }

  /**
   * Create a performance timer for measuring operations
   */
  createPerformanceTimer(namespace: string) {
    return {
      start: (operation: string) => {
        this.time(namespace, operation);
      },
      end: (operation: string, metadata?: any) => {
        this.timeEnd(namespace, operation);
        if (metadata) {
          this.debug(namespace, `📊 ${operation} metadata:`, metadata);
        }
      }
    };
  }

  /**
   * Get development mode status
   */
  isDevelopmentMode(): boolean {
    return this.isDevelopment();
  }

  /**
   * Get production mode status
   */
  isProductionMode(): boolean {
    return this.isProduction();
  }

  /**
   * Execute callback only in development mode
   */
  onlyInDevelopment<T>(callback: () => T): T | undefined {
    return this.devOnly(callback);
  }

  /**
   * Get debug configuration (development only)
   */
  getDebugConfig(): DebugLoggerConfig | undefined {
    return this.devOnly(() => ({ ...this.config }));
  }

  /**
   * Reset debug configuration to defaults (development only)
   */
  resetConfig(): void {
    this.devOnly(() => {
      this.config = {
        level: LogLevel.DEBUG,
        enabledNamespaces: new Set<string>(),
        disabledNamespaces: new Set<string>(),
        colorEnabled: true,
      };
    });
  }
}

// Export singleton instance
export const debugLogger = new DebugLogger();

// Export for testing
export { DebugLogger as DebugLoggerClass };
