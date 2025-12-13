/**
 * Simple Error Messages Test
 */

import { describe, it, expect } from 'vitest';
import { ErrorMessageService } from '../utils/errorMessages';
import { NetworkError, NetworkErrorCodes } from '../types/errors';

describe('ErrorMessageService Basic Tests', () => {
  it('should return a message for network errors', () => {
    const error = new NetworkError(
      'Connection failed',
      NetworkErrorCodes.CONNECTION_FAILED,
      500
    );

    const message = ErrorMessageService.getUserMessage(error);

    expect(message).toBeDefined();
    expect(message.title).toBeDefined();
    expect(message.message).toBeDefined();
    expect(message.actions).toBeDefined();
    expect(message.actions.length).toBeGreaterThan(0);
  });

  it('should have custom messages for all network error codes', () => {
    const codes = Object.values(NetworkErrorCodes);
    
    codes.forEach(code => {
      expect(ErrorMessageService.hasCustomMessage(code)).toBe(true);
    });
  });
});