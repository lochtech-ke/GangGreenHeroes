/**
 * Debug Logger System
 * 
 * Provides enhanced debugging capabilities with:
 * - Log level system (DEBUG, INFO, WARN, ERROR, NONE)
 * - Namespace filtering for targeted debugging
 * - Color-coded console output
 * - Timing utilities for performance measurement
 * 
 * Requirements: C2.1, C2.2, C2.4
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

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

class DebugLoggerClass {
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
    message: string,
    data?: any
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
   * Log a debug message
   */
  debug(namespace: string, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG) || !this.isNamespaceEnabled(namespace)) {
      return;
    }

    const formatted = this.formatMessage(LogLevel.DEBUG, namespace, message, data);
    console.log(formatted);
    
    if (data !== undefined) {
      console.log(data);
    }
  }

  /**
   * Log an info message
   */
  info(namespace: string, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO) || !this.isNamespaceEnabled(namespace)) {
      return;
    }

    const formatted = this.formatMessage(LogLevel.INFO, namespace, message, data);
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

    const formatted = this.formatMessage(LogLevel.WARN, namespace, message, data);
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

    const formatted = this.formatMessage(LogLevel.ERROR, namespace, message, data);
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
   * Enable multiple namespaces at once
   */
  enableMultiple(namespaces: string[]): void {
    namespaces.forEach(ns => this.enable(ns));
  }

  /**
   * Disable multiple namespaces at once
   */
  disableMultiple(namespaces: string[]): void {
    namespaces.forEach(ns => this.disable(ns));
  }

  /**
   * Clear all namespace filters
   */
  clearNamespaces(): void {
    this.config.enabledNamespaces.clear();
    this.config.disabledNamespaces.clear();
  }

  /**
   * Set the log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get the current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Enable or disable color output
   */
  setColorEnabled(enabled: boolean): void {
    this.config.colorEnabled = enabled;
  }

  /**
   * Get list of enabled namespaces
   */
  getEnabledNamespaces(): string[] {
    return Array.from(this.config.enabledNamespaces);
  }

  /**
   * Get list of disabled namespaces
   */
  getDisabledNamespaces(): string[] {
    return Array.from(this.config.disabledNamespaces);
  }

  /**
   * Create a namespaced logger instance
   */
  createNamespacedLogger(namespace: string) {
    return {
      debug: (message: string, data?: any) => this.debug(namespace, message, data),
      info: (message: string, data?: any) => this.info(namespace, message, data),
      warn: (message: string, data?: any) => this.warn(namespace, message, data),
      error: (message: string, error?: Error, data?: any) => this.error(namespace, message, error, data),
      time: (label: string) => this.time(namespace, label),
      timeEnd: (label: string) => this.timeEnd(namespace, label),
    };
  }
}

// Export singleton instance
export const DebugLogger = new DebugLoggerClass();

// Export for testing
export { DebugLoggerClass };
