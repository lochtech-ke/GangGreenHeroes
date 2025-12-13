/**
 * Error Messages Tests
 * Unit tests for user-friendly error message system
 */

import { describe, it, expect } from 'vitest';
import {
  ErrorMessageService,
  createRetryAction,
  createNavigationAction,
  createSupportAction,
  createDismissAction,
  getContextualErrorMessage,
} from './errorMessages';
import {
  NetworkError,
  AuthError,
  ValidationError,
  DatabaseError,
  Web3Error,
  BadgeError,
  CurationError,
  NetworkErrorCodes,
  AuthErrorCodes,
  ValidationErrorCodes,
  DatabaseErrorCodes,
  Web3ErrorCodes,
  BadgeErrorCodes,
  CurationErrorCodes,
  ErrorSeverity,
} from '../types/errors';

describe('ErrorMessageService', () => {
  describe('getUserMessage', () => {
    it('should return specific message for known error codes', () => {
      const error = new NetworkError(
        'Connection failed',
        NetworkErrorCodes.CONNECTION_FAILED,
        500,
        '/api/test'
      );

      const message = ErrorMessageService.getUserMessage(error);

      expect(message.title).toBe('Connection Problem');
      expect(message.message).toContain('trouble connecting to our servers');
      expect(message.severity).toBe(ErrorSeverity.MEDIUM);
      expect(message.category).toBe('network');
      expect(message.actions).toHaveLength(2);
      expect(message.actions[0].label).toBe('Try Again');
      expect(message.actions[0].type).toBe('retry');
    });

    it('should return default message for unknown error codes', () => {
      const error = new NetworkError(
        'Unknown error',
        'UNKNOWN_ERROR_CODE',
        500
      );

      const message = ErrorMessageService.getUserMessage(error);

      expect(message.title).toBe('Something Went Wrong');
      expect(message.message).toContain('encountered an issue');
      expect(message.severity).toBe(ErrorSeverity.MEDIUM);
      expect(message.category).toBe('general');
    });

    it('should customize message based on context', () => {
      const error = new ValidationError(
        'Invalid email',
        ValidationErrorCodes.INVALID_FORMAT,
        'email',
        'invalid-email'
      );

      const message = ErrorMessageService.getUserMessage(error, {
        field: 'email',
        component: 'LoginForm',
      });

      expect(message.message).toContain('Field: email');
    });
  });

  describe('getNetworkErrorMessage', () => {
    it('should return server error message for 5xx status codes', () => {
      const message = ErrorMessageService.getNetworkErrorMessage(500);

      expect(message.title).toBe('Server Error');
      expect(message.message).toContain('Something went wrong on our end');
    });

    it('should return rate limit message for 429 status code', () => {
      const message = ErrorMessageService.getNetworkErrorMessage(429);

      expect(message.title).toBe('Too Many Requests');
      expect(message.message).toContain('making requests too quickly');
    });

    it('should return timeout message for 408 status code', () => {
      const message = ErrorMessageService.getNetworkErrorMessage(408);

      expect(message.title).toBe('Request Timed Out');
      expect(message.message).toContain('taking longer than expected');
    });

    it('should return default message for other status codes', () => {
      const message = ErrorMessageService.getNetworkErrorMessage(404);

      expect(message.title).toBe('Something Went Wrong');
      expect(message.severity).toBe(ErrorSeverity.MEDIUM);
    });
  });

  describe('getValidationErrorMessage', () => {
    it('should return specific message for email field', () => {
      const message = ErrorMessageService.getValidationErrorMessage('email', 'format');

      expect(message.title).toBe('Invalid Email');
      expect(message.message).toContain('valid email address');
      expect(message.message).toContain('user@example.com');
    });

    it('should return specific message for password field', () => {
      const message = ErrorMessageService.getValidationErrorMessage('password', 'length');

      expect(message.title).toBe('Invalid Password');
      expect(message.message).toContain('at least 8 characters');
    });

    it('should return generic message for unknown fields', () => {
      const message = ErrorMessageService.getValidationErrorMessage('customField', 'required');

      expect(message.title).toBe('Invalid CustomField');
      expect(message.message).toContain('check the customField field');
    });
  });

  describe('registerErrorMessage', () => {
    it('should register custom error message', () => {
      const customMessage = {
        title: 'Custom Error',
        message: 'This is a custom error message',
        actions: [{ label: 'OK', type: 'dismiss' as const }],
        severity: ErrorSeverity.LOW,
        category: 'custom',
      };

      ErrorMessageService.registerErrorMessage('CUSTOM_ERROR', customMessage);

      expect(ErrorMessageService.hasCustomMessage('CUSTOM_ERROR')).toBe(true);
      
      const error = new NetworkError('Custom error', 'CUSTOM_ERROR');
      const message = ErrorMessageService.getUserMessage(error);
      
      expect(message.title).toBe('Custom Error');
      expect(message.message).toBe('This is a custom error message');
    });
  });

  describe('error type specific messages', () => {
    it('should handle auth errors correctly', () => {
      const error = new AuthError(
        'Invalid credentials',
        AuthErrorCodes.INVALID_CREDENTIALS,
        'login'
      );

      const message = ErrorMessageService.getUserMessage(error);

      expect(message.title).toBe('Login Failed');
      expect(message.message).toContain('email or password you entered is incorrect');
      expect(message.actions.some(action => action.label === 'Forgot Password?')).toBe(true);
    });

    it('should handle database errors correctly', () => {
      const error = new DatabaseError(
        'Connection failed',
        DatabaseErrorCodes.CONNECTION_FAILED,
        'SELECT * FROM users',
        'users',
        'select'
      );

      const message = ErrorMessageService.getUserMessage(error);

      expect(message.title).toBe('Database Connection Issue');
      expect(message.message).toContain('technical difficulties');
      expect(message.severity).toBe(ErrorSeverity.HIGH);
    });

    it('should handle Web3 errors correctly', () => {
      const error = new Web3Error(
        'Wallet not connected',
        Web3ErrorCodes.WALLET_NOT_CONNECTED,
        'MetaMask'
      );

      const message = ErrorMessageService.getUserMessage(error);

      expect(message.title).toBe('Wallet Not Connected');
      expect(message.message).toContain('connect your wallet');
      expect(message.actions.some(action => action.label === 'Connect Wallet')).toBe(true);
    });

    it('should handle badge errors correctly', () => {
      const error = new BadgeError(
        'Generation failed',
        BadgeErrorCodes.GENERATION_FAILED,
        'badge-123',
        'achievement'
      );

      const message = ErrorMessageService.getUserMessage(error);

      expect(message.title).toBe('Badge Creation Failed');
      expect(message.message).toContain('achievement is still recorded');
      expect(message.icon).toBe('🏆');
    });

    it('should handle curation errors correctly', () => {
      const error = new CurationError(
        'Invalid cohort',
        CurationErrorCodes.INVALID_COHORT,
        'user-123',
        'educational',
        'teen'
      );

      const message = ErrorMessageService.getUserMessage(error);

      expect(message.title).toBe('Age Group Error');
      expect(message.message).toContain('age group settings');
      expect(message.actions.some(action => action.url === '/profile/edit')).toBe(true);
    });
  });
});

describe('Error Action Creators', () => {
  describe('createRetryAction', () => {
    it('should create retry action with default label', () => {
      const retryFn = () => console.log('retry');
      const action = createRetryAction(retryFn);

      expect(action.label).toBe('Try Again');
      expect(action.type).toBe('retry');
      expect(action.primary).toBe(true);
      expect(action.handler).toBe(retryFn);
    });

    it('should create retry action with custom label', () => {
      const retryFn = () => console.log('retry');
      const action = createRetryAction(retryFn, 'Retry Operation');

      expect(action.label).toBe('Retry Operation');
      expect(action.type).toBe('retry');
    });
  });

  describe('createNavigationAction', () => {
    it('should create navigation action with default label', () => {
      const action = createNavigationAction('/home');

      expect(action.label).toBe('Go Back');
      expect(action.type).toBe('navigate');
      expect(action.url).toBe('/home');
    });

    it('should create navigation action with custom label', () => {
      const action = createNavigationAction('/dashboard', 'Go to Dashboard');

      expect(action.label).toBe('Go to Dashboard');
      expect(action.url).toBe('/dashboard');
    });
  });

  describe('createSupportAction', () => {
    it('should create support action without error code', () => {
      const action = createSupportAction();

      expect(action.label).toBe('Contact Support');
      expect(action.type).toBe('contact');
      expect(action.url).toBe('/support');
    });

    it('should create support action with error code', () => {
      const action = createSupportAction('NETWORK_ERROR', 'Get Help');

      expect(action.label).toBe('Get Help');
      expect(action.url).toBe('/support?error=NETWORK_ERROR');
    });
  });

  describe('createDismissAction', () => {
    it('should create dismiss action with default label', () => {
      const action = createDismissAction();

      expect(action.label).toBe('Dismiss');
      expect(action.type).toBe('dismiss');
    });

    it('should create dismiss action with custom label', () => {
      const action = createDismissAction('Close');

      expect(action.label).toBe('Close');
      expect(action.type).toBe('dismiss');
    });
  });
});

describe('getContextualErrorMessage', () => {
  it('should add action context to error message', () => {
    const error = new NetworkError(
      'Connection failed',
      NetworkErrorCodes.CONNECTION_FAILED
    );

    const message = getContextualErrorMessage(error, 'login', 'LoginForm');

    expect(message.message).toContain('while trying to log in');
  });

  it('should handle save action context', () => {
    const error = new DatabaseError(
      'Save failed',
      DatabaseErrorCodes.TRANSACTION_FAILED
    );

    const message = getContextualErrorMessage(error, 'save', 'ProfileForm');

    expect(message.message).toContain('while saving your changes');
  });

  it('should handle upload action context', () => {
    const error = new NetworkError(
      'Upload failed',
      NetworkErrorCodes.TIMEOUT
    );

    const message = getContextualErrorMessage(error, 'upload', 'FileUpload');

    expect(message.message).toContain('while uploading your file');
  });

  it('should not modify message for unknown actions', () => {
    const error = new NetworkError(
      'Connection failed',
      NetworkErrorCodes.CONNECTION_FAILED
    );

    const originalMessage = ErrorMessageService.getUserMessage(error);
    const contextualMessage = getContextualErrorMessage(error, 'unknownAction');

    expect(contextualMessage.message).toBe(originalMessage.message);
  });
});

describe('Error Message Completeness', () => {
  it('should have messages for all network error codes', () => {
    const networkCodes = Object.values(NetworkErrorCodes);
    
    networkCodes.forEach(code => {
      expect(ErrorMessageService.hasCustomMessage(code)).toBe(true);
    });
  });

  it('should have messages for all auth error codes', () => {
    const authCodes = Object.values(AuthErrorCodes);
    
    authCodes.forEach(code => {
      expect(ErrorMessageService.hasCustomMessage(code)).toBe(true);
    });
  });

  it('should have messages for all validation error codes', () => {
    const validationCodes = Object.values(ValidationErrorCodes);
    
    validationCodes.forEach(code => {
      expect(ErrorMessageService.hasCustomMessage(code)).toBe(true);
    });
  });

  it('should have messages for all database error codes', () => {
    const databaseCodes = Object.values(DatabaseErrorCodes);
    
    databaseCodes.forEach(code => {
      expect(ErrorMessageService.hasCustomMessage(code)).toBe(true);
    });
  });

  it('should have messages for all Web3 error codes', () => {
    const web3Codes = Object.values(Web3ErrorCodes);
    
    web3Codes.forEach(code => {
      expect(ErrorMessageService.hasCustomMessage(code)).toBe(true);
    });
  });

  it('should have messages for all badge error codes', () => {
    const badgeCodes = Object.values(BadgeErrorCodes);
    
    badgeCodes.forEach(code => {
      expect(ErrorMessageService.hasCustomMessage(code)).toBe(true);
    });
  });

  it('should have messages for all curation error codes', () => {
    const curationCodes = Object.values(CurationErrorCodes);
    
    curationCodes.forEach(code => {
      expect(ErrorMessageService.hasCustomMessage(code)).toBe(true);
    });
  });
});

describe('Error Message Quality', () => {
  it('should have user-friendly titles (no technical jargon)', () => {
    const registeredCodes = ErrorMessageService.getRegisteredErrorCodes();
    
    registeredCodes.forEach(code => {
      const error = new NetworkError('Test error', code);
      const message = ErrorMessageService.getUserMessage(error);
      
      // Titles should not contain technical terms
      expect(message.title).not.toMatch(/\b(API|HTTP|SQL|JSON|XML|TCP|UDP|DNS)\b/i);
      expect(message.title).not.toMatch(/\b(500|404|403|401|timeout|exception)\b/i);
    });
  });

  it('should have actionable messages', () => {
    const registeredCodes = ErrorMessageService.getRegisteredErrorCodes();
    
    registeredCodes.forEach(code => {
      const error = new NetworkError('Test error', code);
      const message = ErrorMessageService.getUserMessage(error);
      
      // Should have at least one action
      expect(message.actions.length).toBeGreaterThan(0);
      
      // Should have a primary action
      const hasPrimaryAction = message.actions.some(action => action.primary);
      expect(hasPrimaryAction).toBe(true);
    });
  });

  it('should have appropriate severity levels', () => {
    const registeredCodes = ErrorMessageService.getRegisteredErrorCodes();
    
    registeredCodes.forEach(code => {
      const error = new NetworkError('Test error', code);
      const message = ErrorMessageService.getUserMessage(error);
      
      // Severity should be valid
      expect(Object.values(ErrorSeverity)).toContain(message.severity);
    });
  });

  it('should have helpful icons', () => {
    const registeredCodes = ErrorMessageService.getRegisteredErrorCodes();
    
    registeredCodes.forEach(code => {
      const error = new NetworkError('Test error', code);
      const message = ErrorMessageService.getUserMessage(error);
      
      // Should have an icon
      expect(message.icon).toBeDefined();
      expect(typeof message.icon).toBe('string');
      expect(message.icon!.length).toBeGreaterThan(0);
    });
  });
});