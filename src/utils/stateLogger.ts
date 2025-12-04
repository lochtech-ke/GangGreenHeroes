/**
 * State Logging Utilities
 * 
 * Provides utilities for logging application state including:
 * - React Context state snapshots
 * - Component state inspection
 * - State change tracking
 * 
 * Requirements: C2.5
 */

import { DebugLogger } from './debugLogger';

interface StateSnapshot {
  timestamp: Date;
  source: string;
  state: any;
  metadata?: Record<string, any>;
}

interface StateChange {
  timestamp: Date;
  source: string;
  previousState: any;
  newState: any;
  changes: string[];
}

class StateLoggerClass {
  private snapshots: Map<string, StateSnapshot[]>;
  private maxSnapshotsPerSource: number;

  constructor() {
    this.snapshots = new Map();
    this.maxSnapshotsPerSource = 10; // Keep last 10 snapshots per source
  }

  /**
   * Log a state snapshot
   */
  logSnapshot(source: string, state: any, metadata?: Record<string, any>): void {
    const snapshot: StateSnapshot = {
      timestamp: new Date(),
      source,
      state: this.deepClone(state),
      metadata,
    };

    // Store snapshot
    if (!this.snapshots.has(source)) {
      this.snapshots.set(source, []);
    }

    const sourceSnapshots = this.snapshots.get(source)!;
    sourceSnapshots.push(snapshot);

    // Limit snapshots per source
    if (sourceSnapshots.length > this.maxSnapshotsPerSource) {
      sourceSnapshots.shift();
    }

    // Log to debug logger
    DebugLogger.debug(
      `state:${source}`,
      `State snapshot captured`,
      {
        state: this.sanitizeForLogging(state),
        metadata,
      }
    );
  }

  /**
   * Log a state change with diff
   */
  logStateChange(source: string, previousState: any, newState: any): void {
    const changes = this.detectChanges(previousState, newState);

    // Store the state change for potential future use
    const _stateChange: StateChange = {
      timestamp: new Date(),
      source,
      previousState: this.deepClone(previousState),
      newState: this.deepClone(newState),
      changes,
    };

    DebugLogger.info(
      `state:${source}`,
      `State changed: ${changes.length} field(s) updated`,
      {
        changes,
        previous: this.sanitizeForLogging(previousState),
        new: this.sanitizeForLogging(newState),
      }
    );
  }

  /**
   * Log React Context state
   */
  logContextState(contextName: string, contextValue: any): void {
    this.logSnapshot(`context:${contextName}`, contextValue, {
      type: 'React Context',
    });
  }

  /**
   * Log component state
   */
  logComponentState(componentName: string, state: any, props?: any): void {
    this.logSnapshot(`component:${componentName}`, state, {
      type: 'Component State',
      props: props ? this.sanitizeForLogging(props) : undefined,
    });
  }

  /**
   * Get state history for a source
   */
  getStateHistory(source: string): StateSnapshot[] {
    return this.snapshots.get(source) || [];
  }

  /**
   * Get latest state for a source
   */
  getLatestState(source: string): StateSnapshot | null {
    const history = this.getStateHistory(source);
    return history.length > 0 ? history[history.length - 1] : null;
  }

  /**
   * Clear state history for a source
   */
  clearHistory(source: string): void {
    this.snapshots.delete(source);
  }

  /**
   * Clear all state history
   */
  clearAllHistory(): void {
    this.snapshots.clear();
  }

  /**
   * Set maximum snapshots to keep per source
   */
  setMaxSnapshots(max: number): void {
    this.maxSnapshotsPerSource = max;
  }

  /**
   * Deep clone an object (with circular reference protection)
   */
  private deepClone(obj: any, seen: WeakSet<any> = new WeakSet()): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // Check for circular references
    if (seen.has(obj)) {
      return '[Circular Reference]';
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }

    // Add to seen set
    seen.add(obj);

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item, seen));
    }

    if (obj instanceof Map) {
      const cloned = new Map();
      obj.forEach((value, key) => {
        cloned.set(key, this.deepClone(value, seen));
      });
      return cloned;
    }

    if (obj instanceof Set) {
      const cloned = new Set();
      obj.forEach(value => {
        cloned.add(this.deepClone(value, seen));
      });
      return cloned;
    }

    const cloned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key], seen);
      }
    }
    return cloned;
  }

  /**
   * Detect changes between two objects
   */
  private detectChanges(oldObj: any, newObj: any, path: string = ''): string[] {
    const changes: string[] = [];

    // Handle null/undefined
    if (oldObj === null || oldObj === undefined) {
      if (newObj !== null && newObj !== undefined) {
        changes.push(path || 'root');
      }
      return changes;
    }

    if (newObj === null || newObj === undefined) {
      changes.push(path || 'root');
      return changes;
    }

    // Handle primitives
    if (typeof oldObj !== 'object' || typeof newObj !== 'object') {
      if (oldObj !== newObj) {
        changes.push(path || 'root');
      }
      return changes;
    }

    // Handle arrays
    if (Array.isArray(oldObj) && Array.isArray(newObj)) {
      if (oldObj.length !== newObj.length) {
        changes.push(`${path}.length`);
      }
      const maxLength = Math.max(oldObj.length, newObj.length);
      for (let i = 0; i < maxLength; i++) {
        const itemPath = path ? `${path}[${i}]` : `[${i}]`;
        changes.push(...this.detectChanges(oldObj[i], newObj[i], itemPath));
      }
      return changes;
    }

    // Handle objects
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    for (const key of allKeys) {
      const keyPath = path ? `${path}.${key}` : key;
      
      if (!(key in oldObj)) {
        changes.push(`${keyPath} (added)`);
      } else if (!(key in newObj)) {
        changes.push(`${keyPath} (removed)`);
      } else {
        changes.push(...this.detectChanges(oldObj[key], newObj[key], keyPath));
      }
    }

    return changes;
  }

  /**
   * Sanitize state for logging (remove sensitive data, limit size)
   */
  private sanitizeForLogging(state: any, depth: number = 0, maxDepth: number = 5): any {
    // Prevent infinite recursion
    if (depth > maxDepth) {
      return '[Max depth reached]';
    }

    if (state === null || state === undefined) {
      return state;
    }

    // Handle primitives
    if (typeof state !== 'object') {
      return state;
    }

    // Handle arrays
    if (Array.isArray(state)) {
      // Limit array size in logs
      if (state.length > 10) {
        return [
          ...state.slice(0, 5).map(item => this.sanitizeForLogging(item, depth + 1, maxDepth)),
          `... ${state.length - 10} more items ...`,
          ...state.slice(-5).map(item => this.sanitizeForLogging(item, depth + 1, maxDepth)),
        ];
      }
      return state.map(item => this.sanitizeForLogging(item, depth + 1, maxDepth));
    }

    // Handle objects
    const sanitized: any = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken'];

    for (const key in state) {
      if (state.hasOwnProperty(key)) {
        // Redact sensitive keys
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive.toLowerCase()))) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeForLogging(state[key], depth + 1, maxDepth);
        }
      }
    }

    return sanitized;
  }

  /**
   * Create a state logger for a specific context
   */
  createContextLogger(contextName: string) {
    return {
      logState: (state: any) => this.logContextState(contextName, state),
      logChange: (previousState: any, newState: any) =>
        this.logStateChange(`context:${contextName}`, previousState, newState),
      getHistory: () => this.getStateHistory(`context:${contextName}`),
      getLatest: () => this.getLatestState(`context:${contextName}`),
    };
  }

  /**
   * Create a state logger for a specific component
   */
  createComponentLogger(componentName: string) {
    return {
      logState: (state: any, props?: any) => this.logComponentState(componentName, state, props),
      logChange: (previousState: any, newState: any) =>
        this.logStateChange(`component:${componentName}`, previousState, newState),
      getHistory: () => this.getStateHistory(`component:${componentName}`),
      getLatest: () => this.getLatestState(`component:${componentName}`),
    };
  }
}

// Export singleton instance
export const StateLogger = new StateLoggerClass();

// Export for testing
export { StateLoggerClass };

/**
 * React Hook for logging component state changes
 * Note: This should be used inside React components with useEffect
 * 
 * Example usage:
 * ```
 * import { useEffect, useRef } from 'react';
 * 
 * function MyComponent() {
 *   const [state, setState] = useState({});
 *   const prevStateRef = useRef(state);
 *   
 *   useEffect(() => {
 *     if (import.meta.env.DEV) {
 *       StateLogger.logComponentState('MyComponent', state);
 *       if (prevStateRef.current !== state) {
 *         StateLogger.logStateChange('component:MyComponent', prevStateRef.current, state);
 *       }
 *       prevStateRef.current = state;
 *     }
 *   }, [state]);
 * }
 * ```
 */
export function useStateLogger(componentName: string, state: any, enabled: boolean = true) {
  if (!enabled || !import.meta.env.DEV) {
    return;
  }

  // This is a utility function that can be called from useEffect
  // The actual React hook implementation should be done in the component
  StateLogger.logComponentState(componentName, state);
}

/**
 * Higher-order function to wrap context providers with state logging
 * Note: This is a placeholder for future implementation
 */
export function withStateLogging(
  contextName: string,
  ContextProvider: any
): any {
  return function StateLoggedProvider(props: any) {
    // This is a simplified version. In production, you'd intercept the context value
    // and log changes. This requires more complex implementation with React internals.
    // For now, just return the original provider
    return ContextProvider(props);
  };
}
