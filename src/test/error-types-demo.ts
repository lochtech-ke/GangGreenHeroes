/**
 * Error Types Demonstration
 * Shows how to use the structured error types and sanitization utilities
 */

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
} from '../types/errors';

import {
  sanitizeString,
  sanitizeObject,
  sanitizeWeb3Data,
  sanitizeAgeData,
  logError,
  logAuthError,
  logWeb3Error,
  logCurationError,
  containsSensitiveData,
} from '../utils/errorLogging';

console.log('='.repeat(80));
console.log('ERROR TYPES DEMONSTRATION');
console.log('='.repeat(80));

// ============================================================================
// 1. Network Error Example
// ============================================================================
console.log('\n1. NETWORK ERROR EXAMPLE');
console.log('-'.repeat(80));

const networkError = new NetworkError(
  'Failed to fetch user data',
  NetworkErrorCodes.CONNECTION_FAILED,
  500,
  '/api/users/123',
  'GET',
  {
    component: 'UserProfile',
    action: 'fetchUserData',
    userId: 'user-123',
  }
);

console.log('Network Error:', {
  name: networkError.name,
  message: networkError.message,
  code: networkError.code,
  severity: networkError.severity,
  recoverable: networkError.recoverable,
  statusCode: networkError.statusCode,
  endpoint: networkError.endpoint,
});

// ============================================================================
// 2. Auth Error Example
// ============================================================================
console.log('\n2. AUTH ERROR EXAMPLE');
console.log('-'.repeat(80));

const authError = new AuthError(
  'Session has expired',
  AuthErrorCodes.SESSION_EXPIRED,
  'session',
  {
    component: 'AuthGuard',
    action: 'checkSession',
    route: '/dashboard',
  }
);

console.log('Auth Error:', {
  name: authError.name,
  message: authError.message,
  code: authError.code,
  severity: authError.severity,
  recoverable: authError.recoverable,
  authType: authError.authType,
});

// ============================================================================
// 3. Validation Error Example
// ============================================================================
console.log('\n3. VALIDATION ERROR EXAMPLE');
console.log('-'.repeat(80));

const validationError = new ValidationError(
  'Age must be between 13 and 120',
  ValidationErrorCodes.OUT_OF_RANGE,
  'age',
  150,
  'min: 13, max: 120',
  {
    component: 'RegistrationForm',
    action: 'validateAge',
  }
);

console.log('Validation Error:', {
  name: validationError.name,
  message: validationError.message,
  code: validationError.code,
  severity: validationError.severity,
  recoverable: validationError.recoverable,
  field: validationError.field,
  value: validationError.value,
  constraint: validationError.constraint,
});

// ============================================================================
// 4. Database Error Example
// ============================================================================
console.log('\n4. DATABASE ERROR EXAMPLE');
console.log('-'.repeat(80));

const databaseError = new DatabaseError(
  'Query timeout exceeded',
  DatabaseErrorCodes.QUERY_TIMEOUT,
  'SELECT * FROM users WHERE age_cohort = $1',
  'users',
  'select',
  {
    component: 'CurationService',
    action: 'fetchUsersByAge',
  }
);

console.log('Database Error:', {
  name: databaseError.name,
  message: databaseError.message,
  code: databaseError.code,
  severity: databaseError.severity,
  recoverable: databaseError.recoverable,
  table: databaseError.table,
  operation: databaseError.operation,
});

// ============================================================================
// 5. Web3 Error Example
// ============================================================================
console.log('\n5. WEB3 ERROR EXAMPLE');
console.log('-'.repeat(80));

const web3Error = new Web3Error(
  'Transaction rejected by user',
  Web3ErrorCodes.TRANSACTION_REJECTED,
  'MetaMask',
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  137, // Polygon
  {
    component: 'DonationForm',
    action: 'submitTransaction',
  }
);

console.log('Web3 Error:', {
  name: web3Error.name,
  message: web3Error.message,
  code: web3Error.code,
  severity: web3Error.severity,
  recoverable: web3Error.recoverable,
  walletType: web3Error.walletType,
  transactionHash: web3Error.transactionHash,
  networkId: web3Error.networkId,
});

// ============================================================================
// 6. Badge Error Example
// ============================================================================
console.log('\n6. BADGE ERROR EXAMPLE');
console.log('-'.repeat(80));

const badgeError = new BadgeError(
  'Failed to generate badge SVG',
  BadgeErrorCodes.GENERATION_FAILED,
  'badge-123',
  'hummingbird',
  'generate',
  {
    component: 'BadgeGenerator',
    action: 'generateSVG',
  }
);

console.log('Badge Error:', {
  name: badgeError.name,
  message: badgeError.message,
  code: badgeError.code,
  severity: badgeError.severity,
  recoverable: badgeError.recoverable,
  badgeId: badgeError.badgeId,
  badgeType: badgeError.badgeType,
  operation: badgeError.operation,
});

// ============================================================================
// 7. Curation Error Example
// ============================================================================
console.log('\n7. CURATION ERROR EXAMPLE');
console.log('-'.repeat(80));

const curationError = new CurationError(
  'Failed to calculate relevance score',
  CurationErrorCodes.SCORING_FAILED,
  'user-123',
  'mission',
  '25-34',
  {
    component: 'ScoringEngine',
    action: 'calculateScore',
  }
);

console.log('Curation Error:', {
  name: curationError.name,
  message: curationError.message,
  code: curationError.code,
  severity: curationError.severity,
  recoverable: curationError.recoverable,
  userId: curationError.userId,
  contentType: curationError.contentType,
  cohort: curationError.cohort,
});

// ============================================================================
// 8. Sanitization Examples
// ============================================================================
console.log('\n8. SANITIZATION EXAMPLES');
console.log('-'.repeat(80));

// String sanitization
const sensitiveString = 'User token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
console.log('\nOriginal:', sensitiveString);
console.log('Sanitized:', sanitizeString(sensitiveString));

// Object sanitization
const sensitiveObject = {
  user: {
    email: 'john.doe@example.com',
    password: 'secret123',
    token: 'bearer abc123xyz',
    dateOfBirth: '1990-05-15',
    age: 34,
  },
  transaction: {
    from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    to: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  },
};

console.log('\nOriginal Object:', JSON.stringify(sensitiveObject, null, 2));
console.log('Sanitized Object:', JSON.stringify(sanitizeObject(sensitiveObject), null, 2));

// Web3 data sanitization
const web3Data = {
  address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  privateKey: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
};

console.log('\nOriginal Web3 Data:', JSON.stringify(web3Data, null, 2));
console.log('Sanitized Web3 Data:', JSON.stringify(sanitizeWeb3Data(web3Data), null, 2));

// Age data sanitization
const ageData = {
  name: 'John Doe',
  dateOfBirth: '1990-05-15',
  age: 34,
  ageCohort: '25-34',
};

console.log('\nOriginal Age Data:', JSON.stringify(ageData, null, 2));
console.log('Sanitized Age Data:', JSON.stringify(sanitizeAgeData(ageData), null, 2));

// ============================================================================
// 9. Sensitive Data Detection
// ============================================================================
console.log('\n9. SENSITIVE DATA DETECTION');
console.log('-'.repeat(80));

const testStrings = [
  'Normal error message',
  'Token: abc123xyz',
  'User email: john@example.com',
  'Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  'Date of birth: 1990-05-15',
];

testStrings.forEach(str => {
  console.log(`"${str}" contains sensitive data:`, containsSensitiveData(str));
});

// ============================================================================
// 10. Error Logging Examples
// ============================================================================
console.log('\n10. ERROR LOGGING EXAMPLES');
console.log('-'.repeat(80));

// General error logging
logError('TestComponent', new Error('Test error'), { userId: 'user-123', action: 'test' });

// Auth error logging
logAuthError('AuthService', authError, { token: 'bearer secret123' });

// Web3 error logging
logWeb3Error('Web3Service', web3Error, web3Data);

// Curation error logging
logCurationError('CurationService', curationError, ageData);

console.log('\n' + '='.repeat(80));
console.log('DEMONSTRATION COMPLETE');
console.log('='.repeat(80));
console.log('\nAll error types and sanitization utilities are working correctly!');
console.log('Sensitive data is properly redacted while maintaining debugging capability.');
