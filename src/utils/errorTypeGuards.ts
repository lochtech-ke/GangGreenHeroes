/**
 * Error Type Guards
 * TypeScript type guard functions for error classification and validation
 * Requirements: 7.3
 */

import {
  AppError,
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

// ============================================================================
// Base Error Type Guards
// ============================================================================

/**
 * Check if error is an AppError instance
 */
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

/**
 * Check if error has a specific error code
 */
export function hasErrorCode(error: any, code: string): boolean {
  return isAppError(error) && error.code === code;
}

/**
 * Check if error has a specific severity level
 */
export function hasErrorSeverity(error: any, severity: ErrorSeverity): boolean {
  return isAppError(error) && error.severity === severity;
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: any): boolean {
  return isAppError(error) && error.recoverable === true;
}

/**
 * Check if error is critical
 */
export function isCriticalError(error: any): boolean {
  return hasErrorSeverity(error, ErrorSeverity.CRITICAL);
}

// ============================================================================
// Domain-Specific Error Type Guards
// ============================================================================

/**
 * Check if error is a NetworkError
 */
export function isNetworkError(error: any): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * Check if error is an AuthError
 */
export function isAuthError(error: any): error is AuthError {
  return error instanceof AuthError;
}

/**
 * Check if error is a ValidationError
 */
export function isValidationError(error: any): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Check if error is a DatabaseError
 */
export function isDatabaseError(error: any): error is DatabaseError {
  return error instanceof DatabaseError;
}

/**
 * Check if error is a Web3Error
 */
export function isWeb3Error(error: any): error is Web3Error {
  return error instanceof Web3Error;
}

/**
 * Check if error is a BadgeError
 */
export function isBadgeError(error: any): error is BadgeError {
  return error instanceof BadgeError;
}

/**
 * Check if error is a CurationError
 */
export function isCurationError(error: any): error is CurationError {
  return error instanceof CurationError;
}

// ============================================================================
// Network Error Code Guards
// ============================================================================

/**
 * Check if error is a network connection failure
 */
export function isNetworkConnectionError(error: any): error is NetworkError {
  return isNetworkError(error) && error.code === NetworkErrorCodes.CONNECTION_FAILED;
}

/**
 * Check if error is a network timeout
 */
export function isNetworkTimeoutError(error: any): error is NetworkError {
  return isNetworkError(error) && error.code === NetworkErrorCodes.TIMEOUT;
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: any): error is NetworkError {
  return isNetworkError(error) && error.code === NetworkErrorCodes.RATE_LIMITED;
}

/**
 * Check if error is a server error
 */
export function isServerError(error: any): error is NetworkError {
  return isNetworkError(error) && error.code === NetworkErrorCodes.SERVER_ERROR;
}

/**
 * Check if error is an offline error
 */
export function isOfflineError(error: any): error is NetworkError {
  return isNetworkError(error) && error.code === NetworkErrorCodes.OFFLINE;
}

// ============================================================================
// Auth Error Code Guards
// ============================================================================

/**
 * Check if error is invalid credentials
 */
export function isInvalidCredentialsError(error: any): error is AuthError {
  return isAuthError(error) && error.code === AuthErrorCodes.INVALID_CREDENTIALS;
}

/**
 * Check if error is token expired
 */
export function isTokenExpiredError(error: any): error is AuthError {
  return isAuthError(error) && error.code === AuthErrorCodes.TOKEN_EXPIRED;
}

/**
 * Check if error is insufficient permissions
 */
export function isInsufficientPermissionsError(error: any): error is AuthError {
  return isAuthError(error) && error.code === AuthErrorCodes.INSUFFICIENT_PERMISSIONS;
}

/**
 * Check if error is session expired
 */
export function isSessionExpiredError(error: any): error is AuthError {
  return isAuthError(error) && error.code === AuthErrorCodes.SESSION_EXPIRED;
}

/**
 * Check if error is account locked
 */
export function isAccountLockedError(error: any): error is AuthError {
  return isAuthError(error) && error.code === AuthErrorCodes.ACCOUNT_LOCKED;
}

// ============================================================================
// Validation Error Code Guards
// ============================================================================

/**
 * Check if error is required field validation
 */
export function isRequiredFieldError(error: any): error is ValidationError {
  return isValidationError(error) && error.code === ValidationErrorCodes.REQUIRED_FIELD;
}

/**
 * Check if error is invalid format validation
 */
export function isInvalidFormatError(error: any): error is ValidationError {
  return isValidationError(error) && error.code === ValidationErrorCodes.INVALID_FORMAT;
}

/**
 * Check if error is out of range validation
 */
export function isOutOfRangeError(error: any): error is ValidationError {
  return isValidationError(error) && error.code === ValidationErrorCodes.OUT_OF_RANGE;
}

/**
 * Check if error is duplicate value validation
 */
export function isDuplicateValueError(error: any): error is ValidationError {
  return isValidationError(error) && error.code === ValidationErrorCodes.DUPLICATE_VALUE;
}

/**
 * Check if error is invalid age validation
 */
export function isInvalidAgeError(error: any): error is ValidationError {
  return isValidationError(error) && error.code === ValidationErrorCodes.INVALID_AGE;
}

// ============================================================================
// Database Error Code Guards
// ============================================================================

/**
 * Check if error is database connection failure
 */
export function isDatabaseConnectionError(error: any): error is DatabaseError {
  return isDatabaseError(error) && error.code === DatabaseErrorCodes.CONNECTION_FAILED;
}

/**
 * Check if error is database query timeout
 */
export function isDatabaseTimeoutError(error: any): error is DatabaseError {
  return isDatabaseError(error) && error.code === DatabaseErrorCodes.QUERY_TIMEOUT;
}

/**
 * Check if error is database constraint violation
 */
export function isConstraintViolationError(error: any): error is DatabaseError {
  return isDatabaseError(error) && error.code === DatabaseErrorCodes.CONSTRAINT_VIOLATION;
}

/**
 * Check if error is database transaction failure
 */
export function isTransactionFailedError(error: any): error is DatabaseError {
  return isDatabaseError(error) && error.code === DatabaseErrorCodes.TRANSACTION_FAILED;
}

/**
 * Check if error is RLS violation
 */
export function isRLSViolationError(error: any): error is DatabaseError {
  return isDatabaseError(error) && error.code === DatabaseErrorCodes.RLS_VIOLATION;
}

// ============================================================================
// Web3 Error Code Guards
// ============================================================================

/**
 * Check if error is wallet not connected
 */
export function isWalletNotConnectedError(error: any): error is Web3Error {
  return isWeb3Error(error) && error.code === Web3ErrorCodes.WALLET_NOT_CONNECTED;
}

/**
 * Check if error is transaction rejected by user
 */
export function isTransactionRejectedError(error: any): error is Web3Error {
  return isWeb3Error(error) && error.code === Web3ErrorCodes.TRANSACTION_REJECTED;
}

/**
 * Check if error is insufficient gas
 */
export function isInsufficientGasError(error: any): error is Web3Error {
  return isWeb3Error(error) && error.code === Web3ErrorCodes.INSUFFICIENT_GAS;
}

/**
 * Check if error is network mismatch
 */
export function isNetworkMismatchError(error: any): error is Web3Error {
  return isWeb3Error(error) && error.code === Web3ErrorCodes.NETWORK_MISMATCH;
}

/**
 * Check if error is contract error
 */
export function isContractError(error: any): error is Web3Error {
  return isWeb3Error(error) && error.code === Web3ErrorCodes.CONTRACT_ERROR;
}

// ============================================================================
// Badge Error Code Guards
// ============================================================================

/**
 * Check if error is badge generation failure
 */
export function isBadgeGenerationError(error: any): error is BadgeError {
  return isBadgeError(error) && error.code === BadgeErrorCodes.GENERATION_FAILED;
}

/**
 * Check if error is invalid badge metadata
 */
export function isInvalidBadgeMetadataError(error: any): error is BadgeError {
  return isBadgeError(error) && error.code === BadgeErrorCodes.INVALID_METADATA;
}

/**
 * Check if error is badge award failure
 */
export function isBadgeAwardError(error: any): error is BadgeError {
  return isBadgeError(error) && error.code === BadgeErrorCodes.AWARD_FAILED;
}

/**
 * Check if error is duplicate badge
 */
export function isDuplicateBadgeError(error: any): error is BadgeError {
  return isBadgeError(error) && error.code === BadgeErrorCodes.DUPLICATE_BADGE;
}

/**
 * Check if error is badge tier mismatch
 */
export function isBadgeTierMismatchError(error: any): error is BadgeError {
  return isBadgeError(error) && error.code === BadgeErrorCodes.TIER_MISMATCH;
}

// ============================================================================
// Curation Error Code Guards
// ============================================================================

/**
 * Check if error is curation scoring failure
 */
export function isCurationScoringError(error: any): error is CurationError {
  return isCurationError(error) && error.code === CurationErrorCodes.SCORING_FAILED;
}

/**
 * Check if error is invalid cohort
 */
export function isInvalidCohortError(error: any): error is CurationError {
  return isCurationError(error) && error.code === CurationErrorCodes.INVALID_COHORT;
}

/**
 * Check if error is rule validation failure
 */
export function isRuleValidationError(error: any): error is CurationError {
  return isCurationError(error) && error.code === CurationErrorCodes.RULE_VALIDATION_FAILED;
}

/**
 * Check if error is curation cache error
 */
export function isCurationCacheError(error: any): error is CurationError {
  return isCurationError(error) && error.code === CurationErrorCodes.CACHE_ERROR;
}

/**
 * Check if error is curation fallback failure
 */
export function isCurationFallbackError(error: any): error is CurationError {
  return isCurationError(error) && error.code === CurationErrorCodes.FALLBACK_FAILED;
}

// ============================================================================
// Composite Error Guards
// ============================================================================

/**
 * Check if error is retryable based on type and code
 */
export function isRetryableError(error: any): boolean {
  if (!isAppError(error)) {
    return false;
  }

  // Network errors are generally retryable except client errors
  if (isNetworkError(error)) {
    return !isRateLimitError(error); // Rate limits should use exponential backoff
  }

  // Auth errors are retryable only for token expiration
  if (isAuthError(error)) {
    return isTokenExpiredError(error) || isSessionExpiredError(error);
  }

  // Database errors are retryable for timeouts and connection issues
  if (isDatabaseError(error)) {
    return isDatabaseTimeoutError(error) || isDatabaseConnectionError(error);
  }

  // Web3 errors are retryable for network issues and gas estimation
  if (isWeb3Error(error)) {
    return !isTransactionRejectedError(error) && !isWalletNotConnectedError(error);
  }

  // Badge and curation errors with cache issues are retryable
  if (isBadgeError(error) || isCurationError(error)) {
    return error.code.includes('CACHE');
  }

  return false;
}

/**
 * Check if error requires user action
 */
export function requiresUserAction(error: any): boolean {
  if (!isAppError(error)) {
    return false;
  }

  // Auth errors typically require user action
  if (isAuthError(error)) {
    return isInvalidCredentialsError(error) || isAccountLockedError(error);
  }

  // Validation errors require user input correction
  if (isValidationError(error)) {
    return true;
  }

  // Web3 errors that require user interaction
  if (isWeb3Error(error)) {
    return isWalletNotConnectedError(error) || isNetworkMismatchError(error);
  }

  return false;
}

/**
 * Check if error should be reported to monitoring
 */
export function shouldReportToMonitoring(error: any): boolean {
  if (!isAppError(error)) {
    return true; // Report unknown errors
  }

  // Always report critical errors
  if (isCriticalError(error)) {
    return true;
  }

  // Don't report validation errors (user input issues)
  if (isValidationError(error)) {
    return false;
  }

  // Don't report user-rejected Web3 transactions
  if (isTransactionRejectedError(error)) {
    return false;
  }

  // Report all other errors
  return true;
}

/**
 * Get error category for grouping
 */
export function getErrorCategory(error: any): string {
  if (isNetworkError(error)) return 'network';
  if (isAuthError(error)) return 'authentication';
  if (isValidationError(error)) return 'validation';
  if (isDatabaseError(error)) return 'database';
  if (isWeb3Error(error)) return 'web3';
  if (isBadgeError(error)) return 'badge';
  if (isCurationError(error)) return 'curation';
  if (isAppError(error)) return 'application';
  return 'unknown';
}

/**
 * Validate error code format
 */
export function isValidErrorCode(code: string): boolean {
  // Error codes should be uppercase with underscores
  const errorCodePattern = /^[A-Z][A-Z0-9_]*[A-Z0-9]$/;
  return errorCodePattern.test(code);
}

/**
 * Check if error code belongs to a specific domain
 */
export function isErrorCodeFromDomain(code: string, domain: string): boolean {
  const domainPrefixes: Record<string, string[]> = {
    network: ['NETWORK_'],
    auth: ['AUTH_'],
    validation: ['VALIDATION_'],
    database: ['DB_'],
    web3: ['WEB3_'],
    badge: ['BADGE_'],
    curation: ['CURATION_'],
  };

  const prefixes = domainPrefixes[domain.toLowerCase()];
  if (!prefixes) {
    return false;
  }

  return prefixes.some(prefix => code.startsWith(prefix));
}

// ============================================================================
// Error Assertion Utilities
// ============================================================================

/**
 * Assert that error is of specific type (throws if not)
 */
export function assertErrorType<T extends AppError>(
  error: any,
  typeGuard: (error: any) => error is T,
  message?: string
): asserts error is T {
  if (!typeGuard(error)) {
    throw new Error(message || `Expected error to be of specific type, got: ${error?.constructor?.name}`);
  }
}

/**
 * Assert that error has specific code (throws if not)
 */
export function assertErrorCode(error: any, expectedCode: string): asserts error is AppError {
  if (!hasErrorCode(error, expectedCode)) {
    throw new Error(`Expected error code ${expectedCode}, got: ${error?.code}`);
  }
}

/**
 * Assert that error has specific severity (throws if not)
 */
export function assertErrorSeverity(error: any, expectedSeverity: ErrorSeverity): asserts error is AppError {
  if (!hasErrorSeverity(error, expectedSeverity)) {
    throw new Error(`Expected error severity ${expectedSeverity}, got: ${error?.severity}`);
  }
}