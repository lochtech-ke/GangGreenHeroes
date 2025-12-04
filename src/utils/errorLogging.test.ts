/**
 * Tests for Error Logging Utility with Sensitive Data Filtering
 * Validates sanitization of various sensitive data types
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeObject,
  sanitizeWeb3Data,
  sanitizeAgeData,
  containsSensitiveData,
} from './errorLogging';

describe('errorLogging - sanitizeString', () => {
  it('should redact bearer tokens', () => {
    const input = 'Authorization: bearer abc123xyz456';
    const result = sanitizeString(input);
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('abc123xyz456');
  });

  it('should redact API keys', () => {
    const input = 'api_key: sk_live_1234567890abcdef';
    const result = sanitizeString(input);
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('sk_live_1234567890abcdef');
  });

  it('should redact passwords', () => {
    const input = 'password: mySecretPassword123';
    const result = sanitizeString(input);
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('mySecretPassword123');
  });

  it('should partially redact email addresses', () => {
    const input = 'user@example.com';
    const result = sanitizeString(input);
    expect(result).toContain('@example.com');
    expect(result).not.toContain('user@');
    expect(result).toContain('***');
  });

  it('should redact phone numbers', () => {
    const input = 'Phone: 555-123-4567';
    const result = sanitizeString(input);
    expect(result).toContain('***-***-****');
    expect(result).not.toContain('555-123-4567');
  });

  it('should redact JWT tokens', () => {
    const input = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    const result = sanitizeString(input);
    expect(result).toContain('[JWT_TOKEN_REDACTED]');
    expect(result).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
  });

  it('should partially redact Ethereum addresses', () => {
    const input = 'Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
    const result = sanitizeString(input);
    expect(result).toContain('0x742d');
    expect(result).toContain('bEb0');
    expect(result).toContain('...');
    expect(result).not.toContain('6634C0532925a3b844Bc9e7595f');
  });

  it('should partially redact transaction hashes', () => {
    const input = 'TX: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const result = sanitizeString(input);
    expect(result).toContain('0x1234');
    expect(result).toContain('abcdef');
    expect(result).toContain('...');
    expect(result.length).toBeLessThan(input.length);
  });

  it('should redact dates of birth', () => {
    const input = 'DOB: 1990-05-15';
    const result = sanitizeString(input);
    // The dob pattern matches first and redacts the key-value pair
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('1990-05-15');
  });

  it('should handle multiple sensitive patterns in one string', () => {
    const input = 'User: user@example.com, Password: secret123, Token: abc123xyz';
    const result = sanitizeString(input);
    expect(result).toContain('[REDACTED]');
    expect(result).toContain('@example.com');
    expect(result).not.toContain('secret123');
    expect(result).not.toContain('abc123xyz');
  });
});

describe('errorLogging - sanitizeObject', () => {
  it('should redact sensitive keys completely', () => {
    const input = {
      username: 'john',
      password: 'secret123',
      apiKey: 'sk_live_abc123',
      email: 'john@example.com',
    };
    const result = sanitizeObject(input);
    expect(result.password).toBe('[REDACTED]');
    expect(result.apiKey).toBe('[REDACTED]');
    expect(result.username).toBe('john');
    expect(result.email).toContain('@example.com');
  });

  it('should handle nested objects (deep sanitization)', () => {
    const input = {
      user: {
        name: 'John',
        credentials: {
          password: 'secret123',
          token: 'abc123xyz',
        },
      },
    };
    const result = sanitizeObject(input);
    expect(result.user.name).toBe('John');
    expect(result.user.credentials.password).toBe('[REDACTED]');
    expect(result.user.credentials.token).toBe('[REDACTED]');
  });

  it('should handle arrays with objects', () => {
    const input = {
      users: [
        { name: 'John', password: 'secret1' },
        { name: 'Jane', password: 'secret2' },
      ],
    };
    const result = sanitizeObject(input);
    expect(result.users[0].name).toBe('John');
    expect(result.users[0].password).toBe('[REDACTED]');
    expect(result.users[1].name).toBe('Jane');
    expect(result.users[1].password).toBe('[REDACTED]');
  });

  it('should handle Error objects', () => {
    const error = new Error('Something went wrong with token: abc123');
    const result = sanitizeObject(error);
    expect(result.name).toBe('Error');
    expect(result.message).toContain('[REDACTED]');
    expect(result.message).not.toContain('abc123');
  });

  it('should prevent infinite recursion', () => {
    const circular: any = { name: 'test' };
    circular.self = circular;
    const result = sanitizeObject(circular);
    expect(result).toBeDefined();
    // Should not throw stack overflow
  });

  it('should handle Date objects', () => {
    const input = {
      timestamp: new Date('2024-01-01'),
      name: 'test',
    };
    const result = sanitizeObject(input);
    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.name).toBe('test');
  });

  it('should redact Web3-specific keys', () => {
    const input = {
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      mnemonic: 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12',
    };
    const result = sanitizeObject(input);
    expect(result.address).toContain('0x742d');
    expect(result.privateKey).toBe('[REDACTED]');
    expect(result.mnemonic).toBe('[REDACTED]');
  });

  it('should redact age-related keys', () => {
    const input = {
      name: 'John',
      dateOfBirth: '1990-05-15',
      age: 34,
      email: 'john@example.com',
    };
    const result = sanitizeObject(input);
    expect(result.name).toBe('John');
    expect(result.dateOfBirth).toBe('[REDACTED]'); // Redacted by sensitive key matching
    expect(result.age).toBe(34); // Age is kept as-is in general sanitization
  });
});

describe('errorLogging - sanitizeWeb3Data', () => {
  it('should partially redact Ethereum addresses', () => {
    const input = {
      from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
      to: '0x1234567890123456789012345678901234567890',
      amount: '1.5',
    };
    const result = sanitizeWeb3Data(input);
    expect(result.from).toContain('0x742d');
    expect(result.from).toContain('bEb0');
    expect(result.from).toContain('...');
    expect(result.to).toContain('0x1234');
    expect(result.to).toContain('7890');
    expect(result.amount).toBe('1.5');
  });

  it('should partially redact transaction hashes', () => {
    const input = {
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      status: 'confirmed',
    };
    const result = sanitizeWeb3Data(input);
    expect(result.transactionHash).toContain('0x1234');
    expect(result.transactionHash).toContain('abcdef');
    expect(result.transactionHash).toContain('...');
    expect(result.status).toBe('confirmed');
  });

  it('should handle string input', () => {
    const input = 'Transaction: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const result = sanitizeWeb3Data(input);
    expect(result).toContain('0x1234');
    expect(result).toContain('...');
  });
});

describe('errorLogging - sanitizeAgeData', () => {
  it('should redact date of birth fields', () => {
    const input = {
      name: 'John',
      dateOfBirth: '1990-05-15',
      email: 'john@example.com',
    };
    const result = sanitizeAgeData(input);
    expect(result.name).toBe('John');
    expect(result.dateOfBirth).toBe('[REDACTED]');
    expect(result.email).toBe('john@example.com');
  });

  it('should convert exact age to age range', () => {
    const testCases = [
      { age: 15, expected: '13-17' },
      { age: 20, expected: '18-24' },
      { age: 30, expected: '25-34' },
      { age: 40, expected: '35-49' },
      { age: 55, expected: '50+' },
    ];

    testCases.forEach(({ age, expected }) => {
      const input = { name: 'User', age };
      const result = sanitizeAgeData(input);
      expect(result.age).toBe(expected);
    });
  });

  it('should handle multiple age-related fields', () => {
    const input = {
      name: 'John',
      dob: '1990-05-15',
      date_of_birth: '1990-05-15',
      birthDate: '1990-05-15',
      age: 34,
    };
    const result = sanitizeAgeData(input);
    expect(result.dob).toBe('[REDACTED]');
    expect(result.date_of_birth).toBe('[REDACTED]');
    expect(result.birthDate).toBe('[REDACTED]');
    expect(result.age).toBe('25-34');
  });
});

describe('errorLogging - containsSensitiveData', () => {
  it('should detect bearer tokens', () => {
    const input = 'Authorization: bearer abc123xyz456789012345';
    expect(containsSensitiveData(input)).toBe(true);
  });

  it('should detect API tokens', () => {
    const input = 'token: sk_live_1234567890abcdef1234';
    expect(containsSensitiveData(input)).toBe(true);
  });

  it('should detect passwords', () => {
    const input = 'password: mySecret123';
    expect(containsSensitiveData(input)).toBe(true);
  });

  it('should detect JWT tokens', () => {
    const input = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    expect(containsSensitiveData(input)).toBe(true);
  });

  it('should detect Ethereum addresses', () => {
    const input = 'Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
    expect(containsSensitiveData(input)).toBe(true);
  });

  it('should detect transaction hashes', () => {
    const input = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    expect(containsSensitiveData(input)).toBe(true);
  });

  it('should detect dates of birth', () => {
    const input = 'Born on 1990-05-15';
    expect(containsSensitiveData(input)).toBe(true);
  });

  it('should return false for non-sensitive data', () => {
    const input = 'This is a normal message without sensitive data';
    expect(containsSensitiveData(input)).toBe(false);
  });

  it('should handle empty or invalid input', () => {
    expect(containsSensitiveData('')).toBe(false);
    expect(containsSensitiveData(null as any)).toBe(false);
    expect(containsSensitiveData(undefined as any)).toBe(false);
  });
});

describe('errorLogging - edge cases', () => {
  it('should handle null and undefined values', () => {
    expect(sanitizeObject(null)).toBe(null);
    expect(sanitizeObject(undefined)).toBe(undefined);
    expect(sanitizeString(null as any)).toBe(null);
    expect(sanitizeString(undefined as any)).toBe(undefined);
  });

  it('should handle empty objects and arrays', () => {
    expect(sanitizeObject({})).toEqual({});
    expect(sanitizeObject([])).toEqual([]);
  });

  it('should handle objects with null values', () => {
    const input = { name: 'John', password: null, token: undefined };
    const result = sanitizeObject(input);
    expect(result.name).toBe('John');
    expect(result.password).toBe('[REDACTED]');
    expect(result.token).toBe('[REDACTED]');
  });

  it('should handle very deep nesting', () => {
    const input = {
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                password: 'secret',
                data: 'value',
              },
            },
          },
        },
      },
    };
    const result = sanitizeObject(input);
    expect(result.level1.level2.level3.level4.level5.password).toBe('[REDACTED]');
    expect(result.level1.level2.level3.level4.level5.data).toBe('value');
  });

  it('should handle mixed data types in arrays', () => {
    const input = {
      mixed: [
        'string',
        123,
        { password: 'secret' },
        ['nested', { token: 'abc' }],
        null,
        undefined,
      ],
    };
    const result = sanitizeObject(input);
    expect(result.mixed[0]).toBe('string');
    expect(result.mixed[1]).toBe(123);
    expect(result.mixed[2].password).toBe('[REDACTED]');
    expect(result.mixed[3][1].token).toBe('[REDACTED]');
    expect(result.mixed[4]).toBe(null);
    expect(result.mixed[5]).toBe(undefined);
  });
});
