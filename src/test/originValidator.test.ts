/**
 * Basic test for origin validation functionality
 * This tests the core logic that would be used in AuthCallbackPage
 */

import { describe, it, expect } from 'vitest';

// Helper function to simulate the origin validation logic from AuthCallbackPage
const validateOrigin = (currentOrigin: string, allowedOrigins: string[]): boolean => {
  return allowedOrigins.includes(currentOrigin);
};

const getAllowedOrigins = (envOrigins?: string): string[] => {
  if (envOrigins) {
    return envOrigins.split(',').map((origin: string) => origin.trim());
  }
  
  return [
    'https://gg.lochtech.africa',
    'https://ganggreen-platform.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ];
};

describe('Origin Validation', () => {
  it('should allow valid production origin', () => {
    const allowedOrigins = getAllowedOrigins();
    const isValid = validateOrigin('https://gg.lochtech.africa', allowedOrigins);
    expect(isValid).toBe(true);
  });

  it('should allow valid development origins', () => {
    const allowedOrigins = getAllowedOrigins();
    
    expect(validateOrigin('http://localhost:5173', allowedOrigins)).toBe(true);
    expect(validateOrigin('http://localhost:3000', allowedOrigins)).toBe(true);
    expect(validateOrigin('http://127.0.0.1:5173', allowedOrigins)).toBe(true);
  });

  it('should reject invalid origins', () => {
    const allowedOrigins = getAllowedOrigins();
    
    expect(validateOrigin('https://malicious-site.com', allowedOrigins)).toBe(false);
    expect(validateOrigin('http://evil.example.com', allowedOrigins)).toBe(false);
    expect(validateOrigin('https://fake-gg.com', allowedOrigins)).toBe(false);
  });

  it('should support custom allowed origins from environment', () => {
    const customOrigins = 'https://custom.domain.com,https://another.domain.com';
    const allowedOrigins = getAllowedOrigins(customOrigins);
    
    expect(validateOrigin('https://custom.domain.com', allowedOrigins)).toBe(true);
    expect(validateOrigin('https://another.domain.com', allowedOrigins)).toBe(true);
    expect(validateOrigin('https://gg.lochtech.africa', allowedOrigins)).toBe(false);
  });

  it('should handle empty and malformed environment variables', () => {
    const allowedOrigins = getAllowedOrigins('');
    expect(allowedOrigins).toContain('https://gg.lochtech.africa');
    
    const allowedOrigins2 = getAllowedOrigins(undefined);
    expect(allowedOrigins2).toContain('https://gg.lochtech.africa');
  });
});