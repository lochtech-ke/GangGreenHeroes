/**
 * Unit tests for StateLogger
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StateLogger, StateLoggerClass } from './stateLogger';
import { DebugLogger } from './debugLogger';

describe('StateLogger', () => {
  beforeEach(() => {
    // Clear state history before each test
    StateLogger.clearAllHistory();
    
    // Mock DebugLogger methods
    vi.spyOn(DebugLogger, 'debug').mockImplementation(() => {});
    vi.spyOn(DebugLogger, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('State Snapshots', () => {
    it('should log a state snapshot', () => {
      const state = { count: 0, user: { name: 'John' } };
      
      StateLogger.logSnapshot('test', state);
      
      expect(DebugLogger.debug).toHaveBeenCalled();
    });

    it('should store state snapshot in history', () => {
      const state = { count: 0 };
      
      StateLogger.logSnapshot('test', state);
      
      const history = StateLogger.getStateHistory('test');
      expect(history).toHaveLength(1);
      expect(history[0].state).toEqual(state);
    });

    it('should include metadata in snapshot', () => {
      const state = { count: 0 };
      const metadata = { component: 'Counter' };
      
      StateLogger.logSnapshot('test', state, metadata);
      
      const history = StateLogger.getStateHistory('test');
      expect(history[0].metadata).toEqual(metadata);
    });

    it('should limit snapshots per source', () => {
      StateLogger.setMaxSnapshots(3);
      
      for (let i = 0; i < 5; i++) {
        StateLogger.logSnapshot('test', { count: i });
      }
      
      const history = StateLogger.getStateHistory('test');
      expect(history).toHaveLength(3);
      expect(history[0].state.count).toBe(2); // First two were removed
    });

    it('should deep clone state to prevent mutations', () => {
      const state = { nested: { value: 'original' } };
      
      StateLogger.logSnapshot('test', state);
      
      // Mutate original
      state.nested.value = 'modified';
      
      const history = StateLogger.getStateHistory('test');
      expect(history[0].state.nested.value).toBe('original');
    });
  });

  describe('State Changes', () => {
    it('should detect simple value changes', () => {
      const oldState = { count: 0 };
      const newState = { count: 1 };
      
      StateLogger.logStateChange('test', oldState, newState);
      
      expect(DebugLogger.info).toHaveBeenCalled();
      const call = (DebugLogger.info as any).mock.calls[0];
      expect(call[1]).toContain('1 field(s) updated');
    });

    it('should detect nested changes', () => {
      const oldState = { user: { name: 'John', age: 30 } };
      const newState = { user: { name: 'John', age: 31 } };
      
      StateLogger.logStateChange('test', oldState, newState);
      
      const call = (DebugLogger.info as any).mock.calls[0];
      const data = call[2];
      expect(data.changes).toContain('user.age');
    });

    it('should detect added fields', () => {
      const oldState = { count: 0 };
      const newState = { count: 0, newField: 'value' };
      
      StateLogger.logStateChange('test', oldState, newState);
      
      const call = (DebugLogger.info as any).mock.calls[0];
      const data = call[2];
      expect(data.changes.some((c: string) => c.includes('newField') && c.includes('added'))).toBe(true);
    });

    it('should detect removed fields', () => {
      const oldState = { count: 0, oldField: 'value' };
      const newState = { count: 0 };
      
      StateLogger.logStateChange('test', oldState, newState);
      
      const call = (DebugLogger.info as any).mock.calls[0];
      const data = call[2];
      expect(data.changes.some((c: string) => c.includes('oldField') && c.includes('removed'))).toBe(true);
    });

    it('should detect array length changes', () => {
      const oldState = { items: [1, 2, 3] };
      const newState = { items: [1, 2] };
      
      StateLogger.logStateChange('test', oldState, newState);
      
      const call = (DebugLogger.info as any).mock.calls[0];
      const data = call[2];
      expect(data.changes.some((c: string) => c.includes('items.length'))).toBe(true);
    });

    it('should handle null to object changes', () => {
      const oldState = { data: null };
      const newState = { data: { value: 'test' } };
      
      StateLogger.logStateChange('test', oldState, newState);
      
      const call = (DebugLogger.info as any).mock.calls[0];
      const data = call[2];
      expect(data.changes).toContain('data');
    });
  });

  describe('Context State Logging', () => {
    it('should log context state', () => {
      const contextValue = { user: { id: '123', name: 'John' }, loading: false };
      
      StateLogger.logContextState('AuthContext', contextValue);
      
      expect(DebugLogger.debug).toHaveBeenCalled();
      const call = (DebugLogger.debug as any).mock.calls[0];
      expect(call[0]).toBe('state:context:AuthContext');
    });

    it('should store context state in history', () => {
      const contextValue = { user: { id: '123' } };
      
      StateLogger.logContextState('AuthContext', contextValue);
      
      const history = StateLogger.getStateHistory('context:AuthContext');
      expect(history).toHaveLength(1);
      expect(history[0].metadata?.type).toBe('React Context');
    });
  });

  describe('Component State Logging', () => {
    it('should log component state', () => {
      const state = { count: 0 };
      
      StateLogger.logComponentState('Counter', state);
      
      expect(DebugLogger.debug).toHaveBeenCalled();
      const call = (DebugLogger.debug as any).mock.calls[0];
      expect(call[0]).toBe('state:component:Counter');
    });

    it('should include props in component state log', () => {
      const state = { count: 0 };
      const props = { initialCount: 0, onIncrement: () => {} };
      
      StateLogger.logComponentState('Counter', state, props);
      
      const history = StateLogger.getStateHistory('component:Counter');
      expect(history[0].metadata?.props).toBeDefined();
    });
  });

  describe('State History', () => {
    it('should retrieve state history for a source', () => {
      StateLogger.logSnapshot('test', { count: 0 });
      StateLogger.logSnapshot('test', { count: 1 });
      StateLogger.logSnapshot('test', { count: 2 });
      
      const history = StateLogger.getStateHistory('test');
      expect(history).toHaveLength(3);
    });

    it('should retrieve latest state for a source', () => {
      StateLogger.logSnapshot('test', { count: 0 });
      StateLogger.logSnapshot('test', { count: 1 });
      StateLogger.logSnapshot('test', { count: 2 });
      
      const latest = StateLogger.getLatestState('test');
      expect(latest?.state.count).toBe(2);
    });

    it('should return null for non-existent source', () => {
      const latest = StateLogger.getLatestState('nonexistent');
      expect(latest).toBeNull();
    });

    it('should clear history for a specific source', () => {
      StateLogger.logSnapshot('test1', { count: 0 });
      StateLogger.logSnapshot('test2', { count: 0 });
      
      StateLogger.clearHistory('test1');
      
      expect(StateLogger.getStateHistory('test1')).toHaveLength(0);
      expect(StateLogger.getStateHistory('test2')).toHaveLength(1);
    });

    it('should clear all history', () => {
      StateLogger.logSnapshot('test1', { count: 0 });
      StateLogger.logSnapshot('test2', { count: 0 });
      
      StateLogger.clearAllHistory();
      
      expect(StateLogger.getStateHistory('test1')).toHaveLength(0);
      expect(StateLogger.getStateHistory('test2')).toHaveLength(0);
    });
  });

  describe('Data Sanitization', () => {
    it('should redact sensitive fields', () => {
      const state = {
        username: 'john',
        password: 'secret123',
        token: 'abc123',
        apiKey: 'key123',
      };
      
      StateLogger.logSnapshot('test', state);
      
      const call = (DebugLogger.debug as any).mock.calls[0];
      const sanitized = call[2].state;
      
      expect(sanitized.username).toBe('john');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.apiKey).toBe('[REDACTED]');
    });

    it('should limit array size in logs', () => {
      const state = {
        items: Array.from({ length: 20 }, (_, i) => ({ id: i })),
      };
      
      StateLogger.logSnapshot('test', state);
      
      const call = (DebugLogger.debug as any).mock.calls[0];
      const sanitized = call[2].state;
      
      // Should show first 5, ellipsis, last 5
      expect(sanitized.items.length).toBe(11);
      expect(sanitized.items[5]).toContain('more items');
    });

    it('should limit nesting depth', () => {
      const deepState: any = { level: 0 };
      let current = deepState;
      
      // Create deeply nested object
      for (let i = 1; i <= 10; i++) {
        current.nested = { level: i };
        current = current.nested;
      }
      
      StateLogger.logSnapshot('test', deepState);
      
      const call = (DebugLogger.debug as any).mock.calls[0];
      const sanitized = call[2].state;
      
      // Should stop at max depth (maxDepth=5 means 6 levels: 0,1,2,3,4,5)
      let depth = 0;
      let node = sanitized;
      while (node && typeof node === 'object' && node.nested && typeof node.nested === 'object') {
        depth++;
        node = node.nested;
      }
      
      // Should be limited (not reach the full 10 levels)
      expect(depth).toBeLessThan(10);
      expect(depth).toBeLessThanOrEqual(6); // maxDepth of 5 allows 6 levels (0-5)
    });
  });

  describe('Specialized Loggers', () => {
    it('should create context logger', () => {
      const contextLogger = StateLogger.createContextLogger('AuthContext');
      
      contextLogger.logState({ user: { id: '123' } });
      
      expect(DebugLogger.debug).toHaveBeenCalled();
      const history = contextLogger.getHistory();
      expect(history).toHaveLength(1);
    });

    it('should create component logger', () => {
      const componentLogger = StateLogger.createComponentLogger('Counter');
      
      componentLogger.logState({ count: 0 });
      
      expect(DebugLogger.debug).toHaveBeenCalled();
      const history = componentLogger.getHistory();
      expect(history).toHaveLength(1);
    });

    it('should track changes with specialized logger', () => {
      const contextLogger = StateLogger.createContextLogger('AuthContext');
      
      const oldState = { user: null };
      const newState = { user: { id: '123' } };
      
      contextLogger.logChange(oldState, newState);
      
      expect(DebugLogger.info).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle circular references gracefully', () => {
      const state: any = { name: 'test' };
      state.self = state; // Circular reference
      
      // Should not throw - but may hit max depth
      // The deep clone will create a copy up to max depth
      expect(() => {
        StateLogger.logSnapshot('test', state);
      }).not.toThrow();
      
      // Verify it was logged
      expect(DebugLogger.debug).toHaveBeenCalled();
    });

    it('should handle Date objects', () => {
      const state = { timestamp: new Date('2024-01-01') };
      
      StateLogger.logSnapshot('test', state);
      
      const history = StateLogger.getStateHistory('test');
      expect(history[0].state.timestamp).toBeInstanceOf(Date);
    });

    it('should handle Map objects', () => {
      const state = {
        map: new Map([['key1', 'value1'], ['key2', 'value2']]),
      };
      
      StateLogger.logSnapshot('test', state);
      
      const history = StateLogger.getStateHistory('test');
      expect(history[0].state.map).toBeInstanceOf(Map);
      expect(history[0].state.map.get('key1')).toBe('value1');
    });

    it('should handle Set objects', () => {
      const state = {
        set: new Set([1, 2, 3]),
      };
      
      StateLogger.logSnapshot('test', state);
      
      const history = StateLogger.getStateHistory('test');
      expect(history[0].state.set).toBeInstanceOf(Set);
      expect(history[0].state.set.has(2)).toBe(true);
    });

    it('should handle undefined values', () => {
      const state = { value: undefined };
      
      StateLogger.logSnapshot('test', state);
      
      const history = StateLogger.getStateHistory('test');
      expect(history[0].state.value).toBeUndefined();
    });

    it('should handle null values', () => {
      const state = { value: null };
      
      StateLogger.logSnapshot('test', state);
      
      const history = StateLogger.getStateHistory('test');
      expect(history[0].state.value).toBeNull();
    });
  });
});
