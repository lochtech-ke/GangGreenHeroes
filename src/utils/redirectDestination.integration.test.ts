/**
 * Integration test for redirect destination preservation
 * Tests the complete OAuth flow with redirect destination
 * Requirements: 5.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storeCurrentPageAsDestination, getAndClearRedirectDestination } from './redirectDestination';

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

describe('Redirect Destination Integration', () => {
  beforeEach(() => {
    // Reset mocks
    mockSessionStorage.store = {};
    vi.clearAllMocks();
    
    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    });

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should preserve destination through OAuth flow', () => {
    // Simulate user on dashboard page
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://gg.lochtech.africa',
        pathname: '/dashboard',
        search: '?tab=overview',
        hash: '#metrics',
      },
      writable: true,
    });

    // Step 1: User initiates OAuth (auth service stores current page)
    storeCurrentPageAsDestination();

    // Verify destination was stored
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'oauth_redirect_destination',
      expect.stringContaining('"path":"/dashboard"')
    );
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'oauth_redirect_destination',
      expect.stringContaining('"search":"?tab=overview"')
    );
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'oauth_redirect_destination',
      expect.stringContaining('"hash":"#metrics"')
    );

    // Step 2: OAuth callback retrieves and clears destination
    const retrievedDestination = getAndClearRedirectDestination();

    // Verify correct destination was retrieved
    expect(retrievedDestination).toBe('/dashboard?tab=overview#metrics');

    // Verify destination was cleared
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('oauth_redirect_destination');

    // Step 3: Subsequent calls should return null
    const secondCall = getAndClearRedirectDestination();
    expect(secondCall).toBeNull();
  });

  it('should not store invalid pages', () => {
    // Simulate user on auth page (should not be stored)
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://gg.lochtech.africa',
        pathname: '/auth/login',
        search: '',
        hash: '',
      },
      writable: true,
    });

    // Attempt to store current page
    storeCurrentPageAsDestination();

    // Verify nothing was stored
    expect(mockSessionStorage.setItem).not.toHaveBeenCalled();

    // Verify retrieval returns null
    const retrievedDestination = getAndClearRedirectDestination();
    expect(retrievedDestination).toBeNull();
  });

  it('should default to dashboard when no destination stored', () => {
    // No destination stored
    const retrievedDestination = getAndClearRedirectDestination();
    
    expect(retrievedDestination).toBeNull();
    
    // In the actual AuthCallbackPage, this would result in '/dashboard' being used
    const finalDestination = retrievedDestination || '/dashboard';
    expect(finalDestination).toBe('/dashboard');
  });

  it('should handle edge case of root path', () => {
    // Simulate user on root page
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://gg.lochtech.africa',
        pathname: '/',
        search: '',
        hash: '',
      },
      writable: true,
    });

    // Store current page
    storeCurrentPageAsDestination();

    // Verify root path was stored
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'oauth_redirect_destination',
      expect.stringContaining('"path":"/"')
    );

    // Retrieve destination
    const retrievedDestination = getAndClearRedirectDestination();
    expect(retrievedDestination).toBe('/');
  });

  it('should handle marketplace with complex query params', () => {
    // Simulate user on marketplace with filters
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://gg.lochtech.africa',
        pathname: '/marketplace',
        search: '?category=carbon-credits&sort=price&filter=verified',
        hash: '#results',
      },
      writable: true,
    });

    // Store and retrieve
    storeCurrentPageAsDestination();
    const retrievedDestination = getAndClearRedirectDestination();

    expect(retrievedDestination).toBe('/marketplace?category=carbon-credits&sort=price&filter=verified#results');
  });
});