/**
 * Service Layer Error Handling Utilities
 * 
 * Provides utilities for adding error handling to service methods:
 * - Domain-specific error throwing
 * - Error context tracking
 * - Consistent error handling patterns
 * 
 * Requirements: C1.1, C1.3, C7.1
 */

import { errorHandler } from './errorHandler';
import {
  AppError,
  AuthError,
  ValidationError,
  DatabaseError,
  NetworkError,
  BadgeError,
  CurationError,
  ErrorSeverity,
} from '../types/errors';

/**
 * Generic concrete implementation of AppError for service errors
 */
class ServiceError extends AppError {
  constructor(
    message: string,
    code: string,
    severity: ErrorSeverity,
    context?: any,
    recoverable: boolean = false
  ) {
    super(message, code, severity, context, recoverable);
  }
}

/**
 * Service error context
 */
export interface ServiceErrorContext {
  service: string;
  method: string;
  userId?: string;
  params?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Wrap a service method with error handling
 * 
 * Requirement C1.1: Centralized error processing
 * Requirement C1.3: Include error context
 * 
 * Usage:
 * ```typescript
 * export const userService = {
 *   async getUser(userId: string) {
 *     return withServiceErrorHandling(
 *       async () => {
 *         // Service logic here
 *       },
 *       { service: 'UserService', method: 'getUser', userId }
 *     );
 *   }
 * };
 * ```
 */
export async function withServiceErrorHandling<T>(
  operation: () => Promise<T>,
  context: ServiceErrorContext
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // If it's already an AppError, add context and re-throw
    if (error instanceof AppError) {
      // Create new error with merged context (don't mutate readonly property)
      const ErrorClass = error.constructor as any;
      const enhancedError = new ErrorClass(
        error.message,
        error.code,
        error.severity,
        {
          ...error.context,
          component: context.service,
          action: context.method,
          userId: context.userId,
          ...context.metadata,
        },
        error.recoverable
      );
      errorHandler.handleError(enhancedError);
      throw enhancedError;
    }

    // Convert unknown errors to AppError
    const appError = new ServiceError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      'SERVICE_ERROR',
      ErrorSeverity.MEDIUM,
      {
        component: context.service,
        action: context.method,
        userId: context.userId,
        params: context.params,
        ...context.metadata,
        originalError: error instanceof Error ? error.stack : String(error),
      },
      false
    );

    errorHandler.handleError(appError);
    throw appError;
  }
}

/**
 * Authentication Service Error Helpers
 * 
 * Requirement C7.1: Domain-specific error types
 */
export const authErrors = {
  invalidCredentials: (context?: Record<string, any>) =>
    new AuthError(
      'Invalid email or password',
      'INVALID_CREDENTIALS',
      'login',
      context
    ),

  sessionExpired: (context?: Record<string, any>) =>
    new AuthError(
      'Your session has expired. Please log in again.',
      'SESSION_EXPIRED',
      'session',
      context
    ),

  tokenRefreshFailed: (context?: Record<string, any>) =>
    new AuthError(
      'Failed to refresh authentication token',
      'TOKEN_REFRESH_FAILED',
      'token',
      context
    ),

  insufficientPermissions: (context?: Record<string, any>) =>
    new AuthError(
      'You do not have permission to perform this action',
      'INSUFFICIENT_PERMISSIONS',
      'permission',
      context
    ),

  emailNotVerified: (context?: Record<string, any>) =>
    new AuthError(
      'Please verify your email address before continuing',
      'EMAIL_NOT_VERIFIED',
      'login',
      context
    ),

  accountLocked: (context?: Record<string, any>) =>
    new AuthError(
      'Your account has been locked. Please contact support.',
      'ACCOUNT_LOCKED',
      'login',
      context
    ),
};

/**
 * Validation Error Helpers
 * 
 * Requirement C7.1: Domain-specific error types
 */
export const validationErrors = {
  requiredField: (fieldName: string, context?: Record<string, any>) =>
    new ValidationError(
      `${fieldName} is required`,
      'REQUIRED_FIELD',
      fieldName,
      undefined,
      undefined,
      { metadata: { fieldName, ...context } }
    ),

  invalidFormat: (fieldName: string, expectedFormat: string, context?: Record<string, any>) =>
    new ValidationError(
      `${fieldName} has invalid format. Expected: ${expectedFormat}`,
      'INVALID_FORMAT',
      fieldName,
      undefined,
      expectedFormat,
      { metadata: { fieldName, expectedFormat, ...context } }
    ),

  outOfRange: (fieldName: string, min: number, max: number, context?: Record<string, any>) =>
    new ValidationError(
      `${fieldName} must be between ${min} and ${max}`,
      'OUT_OF_RANGE',
      fieldName,
      undefined,
      `${min}-${max}`,
      { metadata: { fieldName, min, max, ...context } }
    ),

  invalidAge: (age: number, context?: Record<string, any>) =>
    new ValidationError(
      `Invalid age: ${age}. Age must be between 13 and 120.`,
      'INVALID_AGE',
      'age',
      age,
      '13-120',
      { metadata: { age, ...context } }
    ),

  duplicateEntry: (fieldName: string, value: string, context?: Record<string, any>) =>
    new ValidationError(
      `${fieldName} '${value}' already exists`,
      'DUPLICATE_ENTRY',
      fieldName,
      value,
      'unique',
      { metadata: { fieldName, value, ...context } }
    ),
};

/**
 * Database Error Helpers
 * 
 * Requirement C7.1: Domain-specific error types
 */
export const databaseErrors = {
  queryFailed: (query: string, context?: Record<string, any>) =>
    new DatabaseError(
      'Database query failed',
      'QUERY_FAILED',
      query,
      undefined,
      undefined,
      { metadata: { query, ...context } }
    ),

  connectionFailed: (context?: Record<string, any>) =>
    new DatabaseError(
      'Failed to connect to database',
      'CONNECTION_FAILED',
      undefined,
      undefined,
      undefined,
      context
    ),

  timeout: (query: string, context?: Record<string, any>) =>
    new DatabaseError(
      'Database query timed out',
      'QUERY_TIMEOUT',
      query,
      undefined,
      undefined,
      { metadata: { query, ...context } }
    ),

  constraintViolation: (constraint: string, context?: Record<string, any>) =>
    new DatabaseError(
      `Database constraint violation: ${constraint}`,
      'CONSTRAINT_VIOLATION',
      undefined,
      undefined,
      undefined,
      { metadata: { constraint, ...context } }
    ),

  recordNotFound: (table: string, id: string, context?: Record<string, any>) =>
    new DatabaseError(
      `Record not found in ${table} with id ${id}`,
      'RECORD_NOT_FOUND',
      undefined,
      table,
      'select',
      { metadata: { table, id, ...context } }
    ),
};

/**
 * Network Error Helpers
 * 
 * Requirement C7.1: Domain-specific error types
 */
export const networkErrors = {
  requestFailed: (url: string, context?: Record<string, any>) =>
    new NetworkError(
      `Network request failed: ${url}`,
      'REQUEST_FAILED',
      undefined,
      url,
      undefined,
      { metadata: { url, ...context } }
    ),

  timeout: (url: string, context?: Record<string, any>) =>
    new NetworkError(
      `Network request timed out: ${url}`,
      'REQUEST_TIMEOUT',
      undefined,
      url,
      undefined,
      { metadata: { url, ...context } }
    ),

  offline: (context?: Record<string, any>) =>
    new NetworkError(
      'No internet connection. Please check your network.',
      'OFFLINE',
      undefined,
      undefined,
      undefined,
      context
    ),

  serverError: (url: string, statusCode: number, context?: Record<string, any>) =>
    new NetworkError(
      `Server error (${statusCode}): ${url}`,
      'SERVER_ERROR',
      statusCode,
      url,
      undefined,
      { metadata: { url, statusCode, ...context } }
    ),
};

/**
 * Badge Service Error Helpers
 * 
 * Requirement C7.1: Domain-specific error types
 */
export const badgeErrors = {
  generationFailed: (badgeType: string, context?: Record<string, any>) =>
    new BadgeError(
      `Failed to generate ${badgeType} badge`,
      'GENERATION_FAILED',
      undefined,
      badgeType,
      'generate',
      { metadata: { badgeType, ...context } }
    ),

  invalidTier: (tier: string, context?: Record<string, any>) =>
    new BadgeError(
      `Invalid badge tier: ${tier}`,
      'INVALID_TIER',
      undefined,
      undefined,
      undefined,
      { metadata: { tier, ...context } }
    ),

  alreadyOwned: (badgeId: string, userId: string, context?: Record<string, any>) =>
    new BadgeError(
      'User already owns this badge',
      'ALREADY_OWNED',
      badgeId,
      undefined,
      undefined,
      { metadata: { badgeId, userId, ...context } }
    ),

  insufficientProgress: (badgeId: string, required: number, current: number, context?: Record<string, any>) =>
    new BadgeError(
      `Insufficient progress for badge. Required: ${required}, Current: ${current}`,
      'INSUFFICIENT_PROGRESS',
      badgeId,
      undefined,
      undefined,
      { metadata: { badgeId, required, current, ...context } }
    ),
};

/**
 * Curation Service Error Helpers
 * 
 * Requirement C7.1: Domain-specific error types
 */
export const curationErrors = {
  scoringFailed: (contentId: string, context?: Record<string, any>) =>
    new CurationError(
      `Failed to calculate relevance score for content ${contentId}`,
      'SCORING_FAILED',
      undefined,
      undefined,
      undefined,
      { metadata: { contentId, ...context } }
    ),

  invalidCohort: (cohort: string, context?: Record<string, any>) =>
    new CurationError(
      `Invalid age cohort: ${cohort}`,
      'INVALID_COHORT',
      undefined,
      undefined,
      cohort,
      { metadata: { cohort, ...context } }
    ),

  ruleValidationFailed: (ruleId: string, reason: string, context?: Record<string, any>) =>
    new CurationError(
      `Curation rule validation failed: ${reason}`,
      'RULE_VALIDATION_FAILED',
      undefined,
      undefined,
      undefined,
      { metadata: { ruleId, reason, ...context } }
    ),

  engineFailure: (context?: Record<string, any>) =>
    new CurationError(
      'Content curation engine failed',
      'ENGINE_FAILURE',
      undefined,
      undefined,
      undefined,
      context
    ),

  insufficientData: (userId: string, context?: Record<string, any>) =>
    new CurationError(
      'Insufficient user data for personalized curation',
      'INSUFFICIENT_DATA',
      userId,
      undefined,
      undefined,
      { userId, ...context }
    ),
};

/**
 * Mission Service Error Helpers
 */
export const missionErrors = {
  notFound: (missionId: string, context?: Record<string, any>) =>
    new DatabaseError(
      `Mission not found: ${missionId}`,
      'MISSION_NOT_FOUND',
      undefined,
      'missions',
      'select',
      { metadata: { missionId, ...context } }
    ),

  alreadyJoined: (missionId: string, userId: string, context?: Record<string, any>) =>
    new ValidationError(
      'You have already joined this mission',
      'ALREADY_JOINED',
      'mission_id',
      missionId,
      'unique',
      { metadata: { missionId, userId, ...context } }
    ),

  capacityReached: (missionId: string, context?: Record<string, any>) =>
    new ServiceError(
      'Mission has reached maximum capacity',
      'CAPACITY_REACHED',
      ErrorSeverity.LOW,
      { missionId, ...context },
      false
    ),

  verificationRequired: (missionId: string, context?: Record<string, any>) =>
    new ServiceError(
      'Verification evidence is required to complete this mission',
      'VERIFICATION_REQUIRED',
      ErrorSeverity.MEDIUM,
      { missionId, ...context },
      false
    ),
};

/**
 * Community Service Error Helpers
 */
export const communityErrors = {
  notFound: (communityId: string, context?: Record<string, any>) =>
    new ServiceError(
      `Community not found: ${communityId}`,
      'COMMUNITY_NOT_FOUND',
      ErrorSeverity.LOW,
      { communityId, ...context },
      false
    ),

  alreadyMember: (communityId: string, userId: string, context?: Record<string, any>) =>
    new ServiceError(
      'You are already a member of this community',
      'ALREADY_MEMBER',
      ErrorSeverity.LOW,
      { communityId, userId, ...context },
      false
    ),

  notMember: (communityId: string, userId: string, context?: Record<string, any>) =>
    new ServiceError(
      'You must be a member to perform this action',
      'NOT_MEMBER',
      ErrorSeverity.MEDIUM,
      { communityId, userId, ...context },
      false
    ),
};

/**
 * GG Coin Service Error Helpers
 */
export const ggCoinErrors = {
  insufficientBalance: (required: number, available: number, context?: Record<string, any>) =>
    new ServiceError(
      `Insufficient GG Coins. Required: ${required}, Available: ${available}`,
      'INSUFFICIENT_BALANCE',
      ErrorSeverity.LOW,
      { required, available, ...context },
      false
    ),

  invalidAmount: (amount: number, context?: Record<string, any>) =>
    new ServiceError(
      `Invalid coin amount: ${amount}. Amount must be positive.`,
      'INVALID_AMOUNT',
      ErrorSeverity.LOW,
      { amount, ...context },
      false
    ),

  transactionFailed: (transactionId: string, context?: Record<string, any>) =>
    new ServiceError(
      `GG Coin transaction failed: ${transactionId}`,
      'TRANSACTION_FAILED',
      ErrorSeverity.HIGH,
      { transactionId, ...context },
      true
    ),
};

// Deprecated: Use ggCoinErrors instead
export const greenCoinErrors = ggCoinErrors;
