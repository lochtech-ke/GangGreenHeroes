/**
 * Tests for Redirect Destination Utility
 * Requirements: 5.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isValidDestination,
  storeRedirectDestination,
  getAndClearRedirectDestination,
  clearRedirectDestination,
  getCurrentDestination,
  storeCurrentPageAsDestination,
} from './redirectDestination';

// Mock sessionStorage
const mockSessionStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockSessionStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockSessionStorage.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockSessionStorage.store[key];
  }),
  clear: vi.fn(() => {
    mockSessionStorage.store = {};
  }),
};

// Mock window.location
const mockLocation = {
  origin: 'https://gg.lochtech.africa',
  pathname: '/dashboard',
  search: '',
  hash: '',
};

describe('redirectDestination', () => {
  beforeEach(() => {
    // Reset mocks
    mockSessionStorage.store = {};
    vi.clearAllMocks();
    
    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    });

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('isValidDestination', () => {
    it('should accept valid dashboard paths', () => {
      expect(isValidDestination('/dashboard')).toBe(true);
      expect(isValidDestination('/dashboard/overview')).toBe(true);
      expect(isValidDestination('dashboard')).toBe(true);
      expect(isValidDestination('dashboard/settings')).toBe(true);
    });

    it('should accept valid profile paths', () => {
      expect(isValidDestination('/profile')).toBe(true);
      expect(isValidDestination('/profile/edit')).toBe(true);
      expect(isValidDestination('profile')).toBe(true);
    });

    it('should accept valid marketplace paths', () => {
      expect(isValidDestination('/marketplace')).toBe(true);
      expect(isValidDestination('/marketplace/credits')).toBe(true);
      expect(isValidDestination('marketplace/buy')).toBe(true);
    });

    it('should accept root path', () => {
      expect(isValidDestination('/')).toBe(true);
      expect(isValidDestination('')).toBe(true);
    });

    it('should reject auth paths to prevent loops', () => {
      expect(isValidDestination('/auth/login')).toBe(false);
      expect(isValidDestination('/auth/callback')).toBe(false);
      expect(isValidDestination('auth/register')).toBe(false);
    });

    it('should reject admin paths', () => {
      expect(isValidDestination('/admin')).toBe(false);
      expect(isValidDestination('/admin/users')).toBe(false);
      expect(isValidDestination('admin/dashboard')).toBe(false);
    });

    it('should reject dangerous URLs', () => {
      expect(isValidDestination('javascript:alert(1)')).toBe(false);
      expect(isValidDestination('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isValidDestination('vbscript:msgbox(1)')).toBe(false);
      expect(isValidDestination('file:///etc/passwd')).toBe(false);
      expect(isValidDestination('ftp://example.com')).toBe(false);
    });

    it('should reject invalid inputs', () => {
      expect(isValidDestination(null as any)).toBe(false);
      expect(isValidDestination(undefined as any)).toBe(false);
      expect(isValidDestination(123 as any)).toBe(false);
      expect(isValidDestination({}  as any)).toBe(false);
    });

    it('should reject API and internal routes', () => {
      expect(isValidDestination('/api/users')).toBe(false);
      expect(isValidDestination('/_next/static')).toBe(false);
      expect(isValidDestination('/_internal')).toBe(false);
    });
  });

  describe('storeRedirectDestination', () => {
    it('should store valid destinations', () => {
      storeRedirectDestination('/dashboard');
      
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'oauth_redirect_destination',
        expect.stringContaining('"path":"/dashboard"')
      );
    });

    it('should not store invalid destinations', () => {
      storeRedirectDestination('/auth/login');
      
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(
        '[RedirectDestination] Invalid destination, not storing:',
        '/auth/login'
      );
    });

    it('should parse and store URL components', () => {
      storeRedirectDestination('/dashboard?tab=overview#section1');
      
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'oauth_redirect_destination',
        expect.stringContaining('"search":"?tab=overview"')
      );
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'oauth_redirect_destination',
        expect.stringContaining('"hash":"#section1"')
      );
    });

    it('should handle storage errors gracefully', () => {
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      storeRedirectDestination('/dashboard');
      
      expect(console.error).toHaveBeenCalledWith(
        '[RedirectDestination] Error storing destination:',
        expect.any(Error)
      );
    });
  });

  describe('getAndClearRedirectDestination', () => {
    it('should retrieve and clear stored destination', () => {
      const testData = {
        path: '/dashboard',
        timestamp: Date.now(),
        search: '?tab=overview',
        hash: '#section1',
      };
      
      mockSessionStorage.store['oauth_redirect_destination'] = JSON.stringify(testData);
      
      const result = getAndClearRedirectDestination();
      
      expect(result).toBe('/dashboard?tab=overview#section1');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('oauth_redirect_destination');
    });

    it('should return null when no destination is stored', () => {
      const result = getAndClearRedirectDestination();
      
      expect(result).toBeNull();
    });

    it('should return null for expired destinations', () => {
      const expiredData = {
        path: '/dashboard',
        timestamp: Date.now() - (11 * 60 * 1000), // 11 minutes ago (expired)
      };
      
      mockSessionStorage.store['oauth_redirect_destination'] = JSON.stringify(expiredData);
      
      const result = getAndClearRedirectDestination();
      
      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith(
        '[RedirectDestination] Destination expired, ignoring'
      );
    });

    it('should return null for invalid stored destinations', () => {
      const invalidData = {
        path: '/auth/login', // Invalid destination
        timestamp: Date.now(),
      };
      
      mockSessionStorage.store['oauth_redirect_destination'] = JSON.stringify(invalidData);
      
      const result = getAndClearRedirectDestination();
      
      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        '[RedirectDestination] Stored destination is invalid, ignoring:',
        '/auth/login'
      );
    });

    it('should handle corrupted storage data', () => {
      mockSessionStorage.store['oauth_redirect_destination'] = 'invalid-json';
      
      const result = getAndClearRedirectDestination();
      
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        '[RedirectDestination] Error retrieving destination:',
        expect.any(Error)
      );
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('oauth_redirect_destination');
    });

    it('should reconstruct destination without search or hash', () => {
      const testData = {
        path: '/dashboard',
        timestamp: Date.now(),
      };
      
      mockSessionStorage.store['oauth_redirect_destination'] = JSON.stringify(testData);
      
      const result = getAndClearRedirectDestination();
      
      expect(result).toBe('/dashboard');
    });
  });

  describe('clearRedirectDestination', () => {
    it('should clear stored destination', () => {
      mockSessionStorage.store['oauth_redirect_destination'] = 'test-data';
      
      clearRedirectDestination();
      
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('oauth_redirect_destination');
      expect(console.log).toHaveBeenCalledWith('[RedirectDestination] Cleared stored destination');
    });

    it('should handle storage errors gracefully', () => {
      mockSessionStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      clearRedirectDestination();
      
      expect(console.error).toHaveBeenCalledWith(
        '[RedirectDestination] Error clearing destination:',
        expect.any(Error)
      );
    });
  });

  describe('getCurrentDestination', () => {
    it('should return current valid destination', () => {
      mockLocation.pathname = '/dashboard';
      mockLocation.search = '?tab=overview';
      mockLocation.hash = '#section1';
      
      const result = getCurrentDestination();
      
      expect(result).toBe('/dashboard?tab=overview#section1');
    });

    it('should return null for invalid destinations', () => {
      mockLocation.pathname = '/auth/login';
      mockLocation.search = '';
      mockLocation.hash = '';
      
      const result = getCurrentDestination();
      
      expect(result).toBeNull();
    });

    it('should return path only when no search or hash', () => {
      mockLocation.pathname = '/dashboard';
      mockLocation.search = '';
      mockLocation.hash = '';
      
      const result = getCurrentDestination();
      
      expect(result).toBe('/dashboard');
    });
  });

  describe('storeCurrentPageAsDestination', () => {
    it('should store current page when valid', () => {
      mockLocation.pathname = '/dashboard';
      mockLocation.search = '?tab=overview';
      mockLocation.hash = '';
      
      storeCurrentPageAsDestination();
      
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'oauth_redirect_destination',
        expect.stringContaining('"path":"/dashboard"')
      );
    });

    it('should not store current page when invalid', () => {
      mockLocation.pathname = '/auth/login';
      mockLocation.search = '';
      mockLocation.hash = '';
      
      storeCurrentPageAsDestination();
      
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    });
  });
});