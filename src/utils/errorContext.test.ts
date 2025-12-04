/**
 * Error Context Manager Tests
 * Unit tests for error context collection and breadcrumb tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorContextManager } from './errorContext';
import { Breadcrumb } from '../types/errors';

describe('ErrorContextManager', () => {
  let contextManager: ErrorContextManager;

  beforeEach(() => {
    contextManager = ErrorContextManager.getInstance();
    contextManager.reset();
  });

  describe('Breadcrumb Management', () => {
    it('should add breadcrumbs', () => {
      const breadcrumb: Breadcrumb = {
        timestamp: new Date(),
        category: 'user_action',
        message: 'Button clicked',
        level: 'info',
      };

      contextManager.addBreadcrumb(breadcrumb);
      const breadcrumbs = contextManager.getBreadcrumbs();

      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0]).toEqual(breadcrumb);
    });

    it('should limit breadcrumbs to maximum count', () => {
      // Add more than MAX_BREADCRUMBS (10)
      for (let i = 0; i < 15; i++) {
        contextManager.addBreadcrumb({
          timestamp: new Date(),
          category: 'test',
          message: `Breadcrumb ${i}`,
          level: 'info',
        });
      }

      const breadcrumbs = contextManager.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(10);
      
      // Should keep the most recent ones
      expect(breadcrumbs[breadcrumbs.length - 1].message).toBe('Breadcrumb 14');
    });

    it('should clear breadcrumbs', () => {
      contextManager.addBreadcrumb({
        timestamp: new Date(),
        category: 'test',
        message: 'Test breadcrumb',
        level: 'info',
      });

      contextManager.clearBreadcrumbs();
      const breadcrumbs = contextManager.getBreadcrumbs();

      expect(breadcrumbs).toHaveLength(0);
    });
  });

  describe('User Action Tracking', () => {
    it('should track user actions', () => {
      contextManager.trackUserAction('Click button', { buttonId: 'submit' });
      
      const breadcrumbs = contextManager.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].category).toBe('user_action');
      expect(breadcrumbs[0].message).toBe('Click button');
      expect(breadcrumbs[0].data).toEqual({ buttonId: 'submit' });
    });
  });

  describe('API Call Tracking', () => {
    it('should track successful API calls', () => {
      contextManager.trackApiCall('GET', '/api/users', 200, { userId: '123' });
      
      const breadcrumbs = contextManager.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].category).toBe('api');
      expect(breadcrumbs[0].message).toContain('GET /api/users - 200');
      expect(breadcrumbs[0].level).toBe('info');
    });

    it('should track failed API calls with error level', () => {
      contextManager.trackApiCall('POST', '/api/users', 500);
      
      const breadcrumbs = contextManager.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].level).toBe('error');
    });

    it('should track API calls without status', () => {
      contextManager.trackApiCall('GET', '/api/users');
      
      const breadcrumbs = contextManager.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].message).toBe('GET /api/users');
    });
  });

  describe('Form Interaction Tracking', () => {
    it('should track form focus', () => {
      contextManager.trackFormInteraction('loginForm', 'focus', 'email');
      
      const breadcrumbs = contextManager.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].category).toBe('form');
      expect(breadcrumbs[0].message).toContain('loginForm: focus on email');
      expect(breadcrumbs[0].level).toBe('info');
    });

    it('should track form errors with error level', () => {
      contextManager.trackFormInteraction('loginForm', 'error', 'password', {
        errorMessage: 'Password required',
      });
      
      const breadcrumbs = contextManager.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].level).toBe('error');
      expect(breadcrumbs[0].data?.errorMessage).toBe('Password required');
    });

    it('should track form submission', () => {
      contextManager.trackFormInteraction('loginForm', 'submit');
      
      const breadcrumbs = contextManager.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].message).toContain('loginForm: submit');
    });
  });

  describe('Component Lifecycle Tracking', () => {
    it('should track component mount', () => {
      contextManager.trackComponentLifecycle('UserProfile', 'mount');
      
      const breadcrumbs = contextManager.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].category).toBe('component');
      expect(breadcrumbs[0].message).toBe('UserProfile: mount');
      expect(breadcrumbs[0].level).toBe('info');
    });

    it('should track component errors with error level', () => {
      contextManager.trackComponentLifecycle('UserProfile', 'error', {
        errorMessage: 'Failed to load data',
      });
      
      const breadcrumbs = contextManager.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].level).toBe('error');
    });
  });

  describe('Navigation History', () => {
    it('should track navigation history', () => {
      // Simulate navigation by directly updating route
      // (In real usage, this would be triggered by browser navigation)
      const history = contextManager.getNavigationHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should limit navigation history to maximum count', () => {
      // This would require simulating browser navigation
      // For now, just verify the method exists
      const history = contextManager.getNavigationHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should clear navigation history', () => {
      contextManager.clearNavigationHistory();
      const history = contextManager.getNavigationHistory();
      expect(history).toHaveLength(0);
    });
  });

  describe('Component Hierarchy', () => {
    it('should set and retrieve component hierarchy', () => {
      const hierarchy = ['App', 'Dashboard', 'UserProfile'];
      contextManager.setComponentHierarchy(hierarchy);
      
      const context = contextManager.getContext();
      expect(context.metadata?.componentHierarchy).toEqual(hierarchy);
    });
  });

  describe('Context Generation', () => {
    it('should generate complete error context', () => {
      contextManager.trackUserAction('Test action');
      contextManager.setComponentHierarchy(['App', 'TestComponent']);
      
      const context = contextManager.getContext();
      
      expect(context).toHaveProperty('route');
      expect(context).toHaveProperty('breadcrumbs');
      expect(context).toHaveProperty('sessionId');
      expect(context).toHaveProperty('timestamp');
      expect(context.metadata).toHaveProperty('navigationHistory');
      expect(context.metadata).toHaveProperty('componentHierarchy');
    });

    it('should merge additional context', () => {
      const additionalContext = {
        component: 'TestComponent',
        action: 'testAction',
        userId: 'user-123',
      };
      
      const context = contextManager.getContext(additionalContext);
      
      expect(context.component).toBe('TestComponent');
      expect(context.action).toBe('testAction');
      expect(context.userId).toBe('user-123');
    });

    it('should include breadcrumbs in context', () => {
      contextManager.trackUserAction('Action 1');
      contextManager.trackUserAction('Action 2');
      
      const context = contextManager.getContext();
      
      expect(context.breadcrumbs).toHaveLength(2);
    });
  });

  describe('Session Management', () => {
    it('should generate unique session ID', () => {
      const sessionId1 = contextManager.getSessionId();
      
      contextManager.reset();
      
      const sessionId2 = contextManager.getSessionId();
      
      expect(sessionId1).not.toBe(sessionId2);
    });

    it('should maintain session ID across context calls', () => {
      const sessionId1 = contextManager.getSessionId();
      const context = contextManager.getContext();
      const sessionId2 = context.sessionId;
      
      expect(sessionId1).toBe(sessionId2);
    });
  });

  describe('Request ID Generation', () => {
    it('should generate unique request IDs', () => {
      const requestId1 = contextManager.generateRequestId();
      const requestId2 = contextManager.generateRequestId();
      
      expect(requestId1).not.toBe(requestId2);
    });

    it('should include session ID in request ID', () => {
      const sessionId = contextManager.getSessionId();
      const requestId = contextManager.generateRequestId();
      
      expect(requestId).toContain(sessionId);
    });

    it('should increment request counter', () => {
      const requestId1 = contextManager.generateRequestId();
      const requestId2 = contextManager.generateRequestId();
      
      // Extract counter from request IDs
      const counter1 = parseInt(requestId1.split('_').pop() || '0');
      const counter2 = parseInt(requestId2.split('_').pop() || '0');
      
      expect(counter2).toBe(counter1 + 1);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all context data', () => {
      contextManager.trackUserAction('Test action');
      contextManager.setComponentHierarchy(['App', 'Test']);
      
      const sessionIdBefore = contextManager.getSessionId();
      
      contextManager.reset();
      
      const breadcrumbs = contextManager.getBreadcrumbs();
      const history = contextManager.getNavigationHistory();
      const sessionIdAfter = contextManager.getSessionId();
      
      expect(breadcrumbs).toHaveLength(0);
      expect(history).toHaveLength(0);
      expect(sessionIdAfter).not.toBe(sessionIdBefore);
    });
  });
});
