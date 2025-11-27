# Design Document

## Overview

This design document outlines the technical approach for implementing a comprehensive error handling and debugging mechanism for the #GangGreen platform. The system will provide centralized error management, structured logging, debugging utilities, automatic error recovery, and production monitoring capabilities.

The design builds upon the existing `errorLogging.ts` utility and extends it with a full-featured error handling infrastructure including React Error Boundaries, retry mechanisms, circuit breakers, Sentry integration, and development-focused debugging tools. The system will handle errors from all platform domains including authentication, Web3 operations, Supabase interactions, badge generation, and general application logic.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Application Layer                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   React      │  │   Services   │  │   API        │          │
│  │  Components  │  │   Layer      │  │   Calls      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                  │
│                            │                                     │
├────────────────────────────┼─────────────────────────────────────┤
│                   Error Handling Layer                           │
├────────────────────────────┼─────────────────────────────────────┤
│                            │                                     │
│  ┌──────────────┐  ┌──────▼───────┐  ┌──────────────┐          │
│  │    Error     │  │   Central    │  │    Error     │          │
│  │  Boundaries  │◄─┤    Error     │──►  Recovery   │          │
│  │              │  │   Handler    │  │   Manager    │          │
│  └──────────────┘  └──────┬───────┘  └──────────────┘          │
│                            │                                     │
│                    ┌───────┴────────┐                            │
│                    │                │                            │
│            ┌───────▼──────┐  ┌─────▼──────┐                     │
│            │    Debug     │  │   Error    │                     │
│            │    Logger    │  │  Analytics │                     │
│            └──────────────┘  └────────────┘                     │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                   Integration Layer                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    Sentry    │  │   Console    │  │   Monitoring │          │
│  │ Integration  │  │   Logging    │  │  Dashboard   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Error Flow Diagram

```
Error Occurs
     │
     ▼
┌─────────────────┐
│  Error Caught   │
│  (try/catch or  │
│  Error Boundary)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Central Error   │
│    Handler      │
└────────┬────────┘
         │
         ├──► Categorize Error Type
         ├──► Sanitize Sensitive Data
         ├──► Add Error Context
         └──► Determine Severity
         │
         ▼
┌─────────────────┐
│  Error Recovery │◄──── Check if Recoverable
│    Manager      │
└────────┬────────┘
         │
         ├─── Recoverable? ──►┌──────────────────┐
         │                    │  Retry Mechanism │
         │                    │  Circuit Breaker │
         │                    └────────┬─────────┘
         │                             │
         │                             ▼
         │                    ┌──────────────────┐
         │                    │  Retry Success?  │
         │                    └────────┬─────────┘
         │                             │
         │                    Yes ─────┤───── No
         │                             │      │
         ▼                             ▼      ▼
┌─────────────────┐         ┌──────────────────┐
│  Log Error      │         │  Show User       │
│  - Console      │         │  Notification    │
│  - Sentry       │         └──────────────────┘
│  - Analytics    │
└─────────────────┘
```

## Components and Interfaces

### 1. Central Error Handler

**Purpose**: Core error processing and routing system

**Location**: `src/utils/errorHandler.ts`

**Interface**:
```typescript
export interface ErrorHandler {
  /**
   * Handle any error through the centralized pipeline
   */
  handleError(error: Error, context?: ErrorContext): void;
  
  /**
   * Register custom error handler for specific error types
   */
  registerHandler(errorType: string, handler: CustomErrorHandler): void;
  
  /**
   * Set error severity threshold for notifications
   */
  setSeverityThreshold(severity: ErrorSeverity): void;
  
  /**
   * Enable/disable error tracking
   */
  setTrackingEnabled(enabled: boolean): void;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  route?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export type CustomErrorHandler = (
  error: Error,
  context: ErrorContext
) => void | Promise<void>;
```

### 2. Structured Error Types

**Purpose**: Domain-specific error classes with error codes

**Location**: `src/types/errors.ts`

**Interface**:
```typescript
// Base error class
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    public context?: ErrorContext,
    public recoverable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Network errors
export class NetworkError extends AppError {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string,
    context?: ErrorContext
  ) {
    super(message, NetworkErrorCode.REQUEST_FAILED, ErrorSeverity.MEDIUM, context, true);
    this.name = 'NetworkError';
  }
}

export enum NetworkErrorCode {
  REQUEST_FAILED = 'NETWORK_REQUEST_FAILED',
  TIMEOUT = 'NETWORK_TIMEOUT',
  NO_CONNECTION = 'NETWORK_NO_CONNECTION',
  SERVER_ERROR = 'NETWORK_SERVER_ERROR',
}

// Authentication errors
export class AuthError extends AppError {
  constructor(
    message: string,
    public code: AuthErrorCode,
    context?: ErrorContext
  ) {
    super(message, code, ErrorSeverity.HIGH, context, code === AuthErrorCode.TOKEN_EXPIRED);
    this.name = 'AuthError';
  }
}

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  SESSION_TIMEOUT = 'AUTH_SESSION_TIMEOUT',
}

// Validation errors
export class ValidationError extends AppError {
  constructor(
    message: string,
    public field?: string,
    public validationRule?: string,
    context?: ErrorContext
  ) {
    super(message, ValidationErrorCode.VALIDATION_FAILED, ErrorSeverity.LOW, context, false);
    this.name = 'ValidationError';
  }
}

export enum ValidationErrorCode {
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  OUT_OF_RANGE = 'VALIDATION_OUT_OF_RANGE',
}

// Database errors
export class DatabaseError extends AppError {
  constructor(
    message: string,
    public code: DatabaseErrorCode,
    public query?: string,
    context?: ErrorContext
  ) {
    super(message, code, ErrorSeverity.HIGH, context, code === DatabaseErrorCode.TIMEOUT);
    this.name = 'DatabaseError';
  }
}

export enum DatabaseErrorCode {
  QUERY_FAILED = 'DB_QUERY_FAILED',
  CONNECTION_FAILED = 'DB_CONNECTION_FAILED',
  TIMEOUT = 'DB_TIMEOUT',
  CONSTRAINT_VIOLATION = 'DB_CONSTRAINT_VIOLATION',
  RLS_VIOLATION = 'DB_RLS_VIOLATION',
}

// Web3 errors
export class Web3Error extends AppError {
  constructor(
    message: string,
    public code: Web3ErrorCode,
    public transactionHash?: string,
    context?: ErrorContext
  ) {
    super(message, code, ErrorSeverity.MEDIUM, context, false);
    this.name = 'Web3Error';
  }
}

export enum Web3ErrorCode {
  USER_REJECTED = 'WEB3_USER_REJECTED',
  INSUFFICIENT_GAS = 'WEB3_INSUFFICIENT_GAS',
  NETWORK_ERROR = 'WEB3_NETWORK_ERROR',
  CONTRACT_REVERT = 'WEB3_CONTRACT_REVERT',
  WALLET_NOT_CONNECTED = 'WEB3_WALLET_NOT_CONNECTED',
}

// Badge errors (extending existing)
export class BadgeError extends AppError {
  constructor(
    message: string,
    public code: BadgeErrorCode,
    context?: ErrorContext
  ) {
    super(message, code, ErrorSeverity.MEDIUM, context, code === BadgeErrorCode.CACHE_ERROR);
    this.name = 'BadgeError';
  }
}

export enum BadgeErrorCode {
  GENERATION_FAILED = 'BADGE_GENERATION_FAILED',
  RENDER_FAILED = 'BADGE_RENDER_FAILED',
  CACHE_ERROR = 'BADGE_CACHE_ERROR',
  INVALID_CONFIG = 'BADGE_INVALID_CONFIG',
}
```

### 3. Error Recovery Manager

**Purpose**: Automatic error recovery with retry and circuit breaker patterns

**Location**: `src/utils/errorRecovery.ts`

**Interface**:
```typescript
export interface ErrorRecoveryManager {
  /**
   * Attempt to recover from an error
   */
  attemptRecovery(error: AppError, operation: () => Promise<any>): Promise<RecoveryResult>;
  
  /**
   * Register recovery strategy for error type
   */
  registerStrategy(errorCode: string, strategy: RecoveryStrategy): void;
  
  /**
   * Check if circuit breaker is open for operation
   */
  isCircuitOpen(operationKey: string): boolean;
  
  /**
   * Reset circuit breaker
   */
  resetCircuit(operationKey: string): void;
}

export interface RecoveryResult {
  success: boolean;
  attempts: number;
  finalError?: Error;
  recoveryMethod?: string;
}

export interface RecoveryStrategy {
  maxRetries: number;
  retryDelay: number; // milliseconds
  backoffMultiplier: number;
  shouldRetry: (error: Error, attempt: number) => boolean;
  onRetry?: (attempt: number) => void;
  onSuccess?: () => void;
  onFailure?: (error: Error) => void;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number; // milliseconds
  monitoringPeriod: number; // milliseconds
}
```

### 4. Debug Logger

**Purpose**: Enhanced logging with filtering and formatting

**Location**: `src/utils/debugLogger.ts`

**Interface**:
```typescript
export interface DebugLogger {
  /**
   * Log debug message
   */
  debug(namespace: string, message: string, data?: any): void;
  
  /**
   * Log info message
   */
  info(namespace: string, message: string, data?: any): void;
  
  /**
   * Log warning
   */
  warn(namespace: string, message: string, data?: any): void;
  
  /**
   * Log error
   */
  error(namespace: string, message: string, error?: Error, data?: any): void;
  
  /**
   * Log with timing information
   */
  time(namespace: string, label: string): void;
  timeEnd(namespace: string, label: string): void;
  
  /**
   * Enable/disable namespace
   */
  enable(namespace: string): void;
  disable(namespace: string): void;
  
  /**
   * Set log level
   */
  setLevel(level: LogLevel): void;
  
  /**
   * Log state snapshot
   */
  logState(namespace: string, state: any): void;
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  namespace: string;
  message: string;
  data?: any;
  duration?: number;
}
```

### 5. Error Boundary Component

**Purpose**: React component for catching and handling component errors

**Location**: `src/components/common/ErrorBoundary.tsx`

**Interface**:
```typescript
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: any[];
  level?: 'critical' | 'section' | 'component';
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  level: 'critical' | 'section' | 'component';
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  resetCount: number;
}
```

### 6. Sentry Integration

**Purpose**: Production error tracking and monitoring

**Location**: `src/utils/sentryIntegration.ts`

**Interface**:
```typescript
export interface SentryIntegration {
  /**
   * Initialize Sentry
   */
  initialize(config: SentryConfig): void;
  
  /**
   * Capture error
   */
  captureError(error: Error, context?: ErrorContext): string;
  
  /**
   * Capture message
   */
  captureMessage(message: string, level: SentryLevel): string;
  
  /**
   * Add breadcrumb
   */
  addBreadcrumb(breadcrumb: Breadcrumb): void;
  
  /**
   * Set user context
   */
  setUser(user: UserContext | null): void;
  
  /**
   * Set tags
   */
  setTags(tags: Record<string, string>): void;
}

export interface SentryConfig {
  dsn: string;
  environment: 'development' | 'staging' | 'production';
  release?: string;
  tracesSampleRate: number;
  beforeSend?: (event: any) => any;
}

export enum SentryLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface Breadcrumb {
  message: string;
  category?: string;
  level?: SentryLevel;
  data?: Record<string, any>;
  timestamp?: number;
}

export interface UserContext {
  id: string;
  email?: string;
  username?: string;
}
```

### 7. Error Analytics

**Purpose**: Track and analyze error patterns

**Location**: `src/services/errorAnalytics.service.ts`

**Interface**:
```typescript
export interface ErrorAnalyticsService {
  /**
   * Track error occurrence
   */
  trackError(error: AppError, context: ErrorContext): Promise<void>;
  
  /**
   * Get error statistics
   */
  getErrorStats(timeRange: TimeRange): Promise<ErrorStats>;
  
  /**
   * Get error trends
   */
  getErrorTrends(timeRange: TimeRange): Promise<ErrorTrend[]>;
  
  /**
   * Get top errors
   */
  getTopErrors(limit: number): Promise<ErrorSummary[]>;
  
  /**
   * Check if error rate exceeds threshold
   */
  checkErrorRateThreshold(): Promise<ThresholdAlert | null>;
}

export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  affectedUsers: number;
  averageResolutionTime: number;
}

export interface ErrorTrend {
  timestamp: Date;
  errorCount: number;
  errorType: string;
}

export interface ErrorSummary {
  errorCode: string;
  message: string;
  occurrences: number;
  affectedUsers: number;
  firstSeen: Date;
  lastSeen: Date;
}

export interface ThresholdAlert {
  errorType: string;
  currentRate: number;
  threshold: number;
  timeWindow: number;
}
```

### 8. Error Notification System

**Purpose**: User-facing error messages and notifications

**Location**: `src/components/common/ErrorNotification.tsx`

**Interface**:
```typescript
export interface ErrorNotificationProps {
  error: AppError;
  onDismiss?: () => void;
  onRetry?: () => void;
  onReport?: () => void;
}

export interface ErrorNotificationConfig {
  title: string;
  message: string;
  actions: ErrorAction[];
  icon?: React.ReactNode;
  severity: ErrorSeverity;
  dismissible: boolean;
  autoHideDuration?: number;
}

export interface ErrorAction {
  label: string;
  onClick: () => void;
  variant: 'primary' | 'secondary' | 'text';
}
```

## Data Models

### Database Schema

#### Error Logs Table

```sql
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_code VARCHAR(100) NOT NULL,
  error_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL,
  stack_trace TEXT,
  user_id UUID REFERENCES auth.users(id),
  component VARCHAR(100),
  action VARCHAR(100),
  route VARCHAR(255),
  metadata JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_error_logs_error_code ON error_logs(error_code);
CREATE INDEX idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX idx_error_logs_resolved ON error_logs(resolved);
```

#### Error Analytics Table

```sql
CREATE TABLE IF NOT EXISTS error_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_code VARCHAR(100) NOT NULL,
  occurrence_count INTEGER DEFAULT 1,
  affected_users INTEGER DEFAULT 1,
  first_seen TIMESTAMP NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMP NOT NULL DEFAULT NOW(),
  average_resolution_time INTEGER, -- milliseconds
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_error_analytics_error_code ON error_analytics(error_code);
CREATE INDEX idx_error_analytics_occurrence_count ON error_analytics(occurrence_count DESC);
CREATE INDEX idx_error_analytics_last_seen ON error_analytics(last_seen);
```

#### Circuit Breaker State Table

```sql
CREATE TABLE IF NOT EXISTS circuit_breaker_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation_key VARCHAR(255) UNIQUE NOT NULL,
  state VARCHAR(20) NOT NULL, -- 'closed', 'open', 'half_open'
  failure_count INTEGER DEFAULT 0,
  last_failure_at TIMESTAMP,
  opened_at TIMESTAMP,
  reset_at TIMESTAMP,
  config JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_circuit_breaker_operation_key ON circuit_breaker_state(operation_key);
CREATE INDEX idx_circuit_breaker_state ON circuit_breaker_state(state);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing all testable criteria, I've identified the following properties and their relationships:

**Consolidated Properties:**
- All error categorization requirements (1.2, 7.1, 7.2) → Single property about error type classification
- All sanitization requirements (1.4, 8.3) → Single property about sensitive data removal
- All retry requirements (4.1, 4.2, 9.3) → Single property about retry behavior
- All recovery requirements (4.3, 4.4, 4.5) → Single property about recovery mechanisms

### Core Correctness Properties

Property 1: Error Categorization
*For any* error that occurs in the application, the Error Handler should correctly categorize it by type (network, validation, authentication, database, runtime, web3, badge)
**Validates: Requirements 1.2, 7.1, 7.2**

Property 2: Sensitive Data Sanitization
*For any* error that is logged or reported, all sensitive data (tokens, passwords, API keys, PII) should be redacted before storage or transmission
**Validates: Requirements 1.4, 8.3**

Property 3: Error Context Preservation
*For any* error that is handled, the error context should include timestamp, user ID (if available), component name, and action being performed
**Validates: Requirements 1.3, 15.1, 15.2, 15.3, 15.4, 15.5**

Property 4: Retry Mechanism Behavior
*For any* recoverable error, the retry mechanism should attempt up to the configured maximum retries with exponential backoff between attempts
**Validates: Requirements 4.1, 4.2, 9.3**

Property 5: Circuit Breaker State Transitions
*For any* operation protected by a circuit breaker, when failure count exceeds threshold, the circuit should open and prevent further attempts until reset timeout
**Validates: Requirements 4.3**

Property 6: Error Boundary Isolation
*For any* component error caught by an Error Boundary, the error should not propagate to parent components and should display a fallback UI
**Validates: Requirements 6.1, 6.4**

Property 7: User Notification Clarity
*For any* user-facing error, the notification should contain a non-technical message and at least one actionable button (Retry, Go Back, Contact Support)
**Validates: Requirements 3.1, 3.2, 3.5**

Property 8: Debug Namespace Filtering
*For any* debug log with a specific namespace, when that namespace is disabled, the log should not be output to the console
**Validates: Requirements 2.2**

Property 9: Error Rate Limiting
*For any* error that occurs repeatedly with the same error code, after exceeding the rate limit threshold, subsequent identical errors should be suppressed and counted
**Validates: Requirements 14.1, 14.2, 14.3**

Property 10: Sentry Error Capture
*For any* error in production environment, the error should be captured by Sentry with sanitized data and full context
**Validates: Requirements 8.1, 8.2, 8.3**

Property 11: Recovery Strategy Selection
*For any* error with a registered recovery strategy, the Error Recovery Manager should apply the appropriate strategy based on error type
**Validates: Requirements 4.1, 4.2, 4.4, 4.5**

Property 12: Error Analytics Tracking
*For any* error that occurs, the error analytics system should increment occurrence count and update last seen timestamp
**Validates: Requirements 5.1, 5.4**

Property 13: Web3 Error Classification
*For any* Web3 error, the system should correctly identify the error type (user rejection, insufficient gas, network error, contract revert, wallet not connected)
**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

Property 14: Supabase Error Classification
*For any* Supabase error, the system should correctly distinguish between network errors, permission errors, and data errors
**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**

Property 15: Development Mode Isolation
*For any* development-only debugging feature, when running in production mode, the feature should be completely disabled and not execute
**Validates: Requirements 13.5**

## Error Handling

### Error Processing Pipeline

```typescript
// Central error processing pipeline
export async function processError(
  error: Error,
  context?: ErrorContext
): Promise<void> {
  try {
    // 1. Categorize error
    const categorizedError = categorizeError(error);
    
    // 2. Add context
    const enrichedError = enrichErrorWithContext(categorizedError, context);
    
    // 3. Sanitize sensitive data
    const sanitizedError = sanitizeError(enrichedError);
    
    // 4. Check rate limiting
    if (shouldRateLimit(sanitizedError)) {
      incrementSuppressedCount(sanitizedError.code);
      return;
    }
    
    // 5. Attempt recovery if applicable
    if (sanitizedError.recoverable) {
      const recovered = await attemptRecovery(sanitizedError);
      if (recovered) {
        logRecoverySuccess(sanitizedError);
        return;
      }
    }
    
    // 6. Log error
    await logError(sanitizedError);
    
    // 7. Send to analytics
    await trackError(sanitizedError);
    
    // 8. Send to Sentry (production only)
    if (isProduction()) {
      await sendToSentry(sanitizedError);
    }
    
    // 9. Notify user if needed
    if (shouldNotifyUser(sanitizedError)) {
      showErrorNotification(sanitizedError);
    }
    
    // 10. Alert admins if critical
    if (sanitizedError.severity === ErrorSeverity.CRITICAL) {
      await alertAdministrators(sanitizedError);
    }
  } catch (handlerError) {
    // Fallback: log to console if error handler fails
    console.error('Error handler failed:', handlerError);
    console.error('Original error:', error);
  }
}
```

### Recovery Strategies

```typescript
// Network request retry strategy
export const networkRetryStrategy: RecoveryStrategy = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  shouldRetry: (error, attempt) => {
    if (error instanceof NetworkError) {
      // Don't retry 4xx errors (except 429)
      if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        return error.statusCode === 429; // Retry rate limits
      }
      return true;
    }
    return false;
  },
  onRetry: (attempt) => {
    debugLogger.info('network', `Retrying request (attempt ${attempt})`);
  },
};

// Token refresh strategy
export const tokenRefreshStrategy: RecoveryStrategy = {
  maxRetries: 1,
  retryDelay: 0,
  backoffMultiplier: 1,
  shouldRetry: (error) => {
    return error instanceof AuthError && error.code === AuthErrorCode.TOKEN_EXPIRED;
  },
  onRetry: async () => {
    await refreshAuthToken();
  },
};

// Circuit breaker configuration
export const defaultCircuitBreakerConfig: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  monitoringPeriod: 120000, // 2 minutes
};
```

### Graceful Degradation

1. **Cache Failures**: Fall back to direct API calls
2. **Network Errors**: Show cached data with stale indicator
3. **Authentication Errors**: Redirect to login with return URL
4. **Database Errors**: Retry with exponential backoff, then show error
5. **Web3 Errors**: Provide manual transaction tracking link

## Testing Strategy

### Unit Testing

**Test Coverage Areas:**
- Error categorization logic
- Sanitization functions
- Retry mechanism with various scenarios
- Circuit breaker state transitions
- Error boundary rendering
- Debug logger filtering
- Error notification rendering

**Example Unit Tests:**
```typescript
describe('Error Handler', () => {
  test('categorizes network errors correctly', () => {
    const error = new Error('Network request failed');
    error.name = 'NetworkError';
    
    const categorized = categorizeError(error);
    
    expect(categorized).toBeInstanceOf(NetworkError);
    expect(categorized.code).toBe(NetworkErrorCode.REQUEST_FAILED);
  });
  
  test('sanitizes sensitive data from errors', () => {
    const error = new Error('Auth failed: token abc123xyz');
    
    const sanitized = sanitizeError(error);
    
    expect(sanitized.message).not.toContain('abc123xyz');
    expect(sanitized.message).toContain('[REDACTED]');
  });
  
  test('retries with exponential backoff', async () => {
    const mockOperation = vi.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValueOnce('Success');
    
    const result = await retryWithBackoff(mockOperation, {
      maxRetries: 3,
      retryDelay: 100,
      backoffMultiplier: 2,
    });
    
    expect(mockOperation).toHaveBeenCalledTimes(3);
    expect(result).toBe('Success');
  });
});

describe('Circuit Breaker', () => {
  test('opens circuit after threshold failures', async () => {
    const breaker = new CircuitBreaker('test-operation', {
      failureThreshold: 3,
      resetTimeout: 1000,
    });
    
    // Trigger failures
    for (let i = 0; i < 3; i++) {
      await breaker.execute(() => Promise.reject(new Error('Fail')));
    }
    
    expect(breaker.isOpen()).toBe(true);
  });
  
  test('prevents execution when circuit is open', async () => {
    const breaker = new CircuitBreaker('test-operation', {
      failureThreshold: 1,
      resetTimeout: 1000,
    });
    
    await breaker.execute(() => Promise.reject(new Error('Fail')));
    
    await expect(
      breaker.execute(() => Promise.resolve('Success'))
    ).rejects.toThrow('Circuit breaker is open');
  });
});

describe('Error Boundary', () => {
  test('catches component errors and shows fallback', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };
    
    const { getByText } = render(
      <ErrorBoundary fallback={ErrorFallback}>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(getByText(/something went wrong/i)).toBeInTheDocument();
  });
  
  test('resets error state when reset button clicked', () => {
    const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) throw new Error('Test error');
      return <div>Success</div>;
    };
    
    const { getByText, rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(getByText(/something went wrong/i)).toBeInTheDocument();
    
    fireEvent.click(getByText(/try again/i));
    
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    
    expect(getByText('Success')).toBeInTheDocument();
  });
});
```

### Property-Based Testing

**Property Test Framework**: fast-check (JavaScript/TypeScript)

**Property Tests:**

```typescript
import fc from 'fast-check';

describe('Error Handling Properties', () => {
  test('Property 2: Sensitive data sanitization', () => {
    fc.assert(
      fc.property(
        fc.record({
          message: fc.string(),
          token: fc.hexaString({ minLength: 20, maxLength: 40 }),
          password: fc.string({ minLength: 8 }),
          email: fc.emailAddress(),
        }),
        (errorData) => {
          const error = new Error(
            `Error: ${errorData.message} token=${errorData.token} password=${errorData.password} email=${errorData.email}`
          );
          
          const sanitized = sanitizeError(error);
          
          // Sensitive data should be redacted
          expect(sanitized.message).not.toContain(errorData.token);
          expect(sanitized.message).not.toContain(errorData.password);
          expect(sanitized.message).toContain('[REDACTED]');
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('Property 4: Retry mechanism behavior', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 100, max: 1000 }),
        fc.float({ min: 1.5, max: 3 }),
        async (maxRetries, retryDelay, backoffMultiplier) => {
          let attempts = 0;
          const operation = () => {
            attempts++;
            return Promise.reject(new Error('Fail'));
          };
          
          try {
            await retryWithBackoff(operation, {
              maxRetries,
              retryDelay,
              backoffMultiplier,
            });
          } catch (error) {
            // Should attempt maxRetries + 1 times (initial + retries)
            expect(attempts).toBe(maxRetries + 1);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
  
  test('Property 8: Debug namespace filtering', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 3, maxLength: 10 }), { minLength: 1, maxLength: 5 }),
        fc.string({ minLength: 3, maxLength: 10 }),
        (enabledNamespaces, disabledNamespace) => {
          const logger = new DebugLogger();
          
          // Enable specific namespaces
          enabledNamespaces.forEach(ns => logger.enable(ns));
          
          // Disabled namespace should not log
          const consoleSpy = vi.spyOn(console, 'log');
          logger.debug(disabledNamespace, 'Test message');
          
          if (enabledNamespaces.includes(disabledNamespace)) {
            expect(consoleSpy).toHaveBeenCalled();
          } else {
            expect(consoleSpy).not.toHaveBeenCalled();
          }
          
          consoleSpy.mockRestore();
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('Property 9: Error rate limiting', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 20 }),
        fc.integer({ min: 5, max: 20 }),
        fc.integer({ min: 21, max: 50 }),
        (errorCode, rateLimit, totalErrors) => {
          const rateLimiter = new ErrorRateLimiter({ limit: rateLimit, window: 60000 });
          let suppressedCount = 0;
          
          for (let i = 0; i < totalErrors; i++) {
            if (rateLimiter.shouldSuppress(errorCode)) {
              suppressedCount++;
            }
          }
          
          // Should suppress errors after rate limit
          expect(suppressedCount).toBe(totalErrors - rateLimit);
        }
      ),
      { numRuns: 50 }
    );
  });
});
```

### Integration Testing

**Test Scenarios:**
1. End-to-end error flow from component to Sentry
2. Error recovery with real API calls
3. Circuit breaker with database operations
4. Error boundary with routing
5. Error analytics with real database

**Example Integration Test:**
```typescript
describe('Error System Integration', () => {
  test('handles network error with retry and recovery', async () => {
    let attempts = 0;
    const mockApi = vi.fn(() => {
      attempts++;
      if (attempts < 3) {
        throw new NetworkError('Request failed', 500);
      }
      return Promise.resolve({ data: 'success' });
    });
    
    const result = await errorHandler.handleWithRecovery(
      () => mockApi(),
      { errorType: 'network' }
    );
    
    expect(attempts).toBe(3);
    expect(result.data).toBe('success');
    
    // Verify error was logged
    const logs = await getErrorLogs();
    expect(logs).toHaveLength(2); // 2 failed attempts logged
    expect(logs[0].error_code).toBe(NetworkErrorCode.REQUEST_FAILED);
  });
  
  test('opens circuit breaker after repeated failures', async () => {
    const failingOperation = () => Promise.reject(new Error('Database timeout'));
    
    // Trigger failures
    for (let i = 0; i < 5; i++) {
      try {
        await circuitBreaker.execute('db-query', failingOperation);
      } catch (error) {
        // Expected
      }
    }
    
    // Circuit should be open
    expect(circuitBreaker.isOpen('db-query')).toBe(true);
    
    // Next attempt should fail immediately
    const start = Date.now();
    try {
      await circuitBreaker.execute('db-query', failingOperation);
    } catch (error) {
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(10); // Should fail immediately
    }
  });
});
```

## Development Tools

### Debug Console Commands

```typescript
// Global debug object (development only)
if (process.env.NODE_ENV === 'development') {
  (window as any).__DEBUG__ = {
    // Enable verbose logging
    enableVerbose: () => {
      debugLogger.setLevel(LogLevel.DEBUG);
      debugLogger.enable('*');
    },
    
    // Disable all logging
    disableAll: () => {
      debugLogger.setLevel(LogLevel.NONE);
    },
    
    // Get error statistics
    getErrorStats: async () => {
      return await errorAnalytics.getErrorStats({ hours: 24 });
    },
    
    // Trigger test error
    triggerError: (type: string) => {
      switch (type) {
        case 'network':
          throw new NetworkError('Test network error', 500);
        case 'auth':
          throw new AuthError('Test auth error', AuthErrorCode.UNAUTHORIZED);
        default:
          throw new Error('Test error');
      }
    },
    
    // Get circuit breaker status
    getCircuitStatus: (key: string) => {
      return circuitBreaker.getStatus(key);
    },
    
    // Reset circuit breaker
    resetCircuit: (key: string) => {
      circuitBreaker.reset(key);
    },
    
    // Log current state
    logState: () => {
      debugLogger.logState('app', store.getState());
    },
  };
}
```

### React DevTools Integration

```typescript
// Add error context to React DevTools
export function useErrorContext() {
  const [errorHistory, setErrorHistory] = useState<Error[]>([]);
  
  useEffect(() => {
    const handler = (error: Error) => {
      setErrorHistory(prev => [...prev, error].slice(-10));
    };
    
    errorHandler.on('error', handler);
    
    return () => errorHandler.off('error', handler);
  }, []);
  
  // Expose to DevTools
  useDebugValue(errorHistory, errors => 
    `${errors.length} errors in history`
  );
  
  return errorHistory;
}
```

## Performance Considerations

### Error Handling Performance

- Error categorization: < 1ms
- Sanitization: < 5ms
- Logging: < 10ms (async)
- Sentry capture: < 50ms (async, non-blocking)
- Rate limiting check: < 1ms

### Optimization Strategies

1. **Lazy Loading**: Load Sentry SDK only in production
2. **Batching**: Batch error logs to reduce database writes
3. **Caching**: Cache circuit breaker state in memory
4. **Throttling**: Throttle error analytics updates
5. **Async Processing**: Process errors asynchronously to not block UI

## Monitoring and Alerting

### Key Metrics

- Error rate (errors per minute)
- Error rate by type
- Error rate by severity
- Recovery success rate
- Circuit breaker open count
- Average error resolution time
- Affected user count

### Alert Thresholds

- Error rate > 10 errors/minute: Warning
- Error rate > 50 errors/minute: Critical
- Critical error occurred: Immediate
- Circuit breaker opened: Warning
- Recovery failure rate > 50%: Warning
- Same error > 100 occurrences/hour: Warning

### Dashboards

1. **Error Overview Dashboard**
   - Total errors (24h, 7d, 30d)
   - Error rate trends
   - Top errors by occurrence
   - Errors by severity
   - Affected users

2. **Recovery Dashboard**
   - Recovery attempts
   - Recovery success rate
   - Circuit breaker status
   - Retry statistics

3. **Performance Dashboard**
   - Error handling latency
   - Logging performance
   - Sentry capture time
   - Database write performance

## Security Considerations

### Data Privacy

- Sanitize all PII before logging
- Encrypt error logs at rest
- Implement data retention policies (90 days)
- Anonymize user IDs in analytics
- Comply with GDPR right to erasure

### Access Control

- Restrict error log access to admins
- Implement audit logging for error log access
- Secure Sentry DSN in environment variables
- Rate limit error reporting endpoints
- Validate all error context data

## Documentation

### Developer Documentation

- Error handling best practices guide
- Custom error type creation guide
- Recovery strategy implementation guide
- Debugging tools reference
- Sentry integration guide

### User Documentation

- Error message glossary
- Troubleshooting common errors
- How to report errors
- Understanding error notifications

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- Implement central error handler
- Create structured error types
- Build sanitization utilities
- Set up error logging

### Phase 2: Recovery Mechanisms (Week 2)
- Implement retry mechanism
- Build circuit breaker
- Create recovery strategies
- Add error recovery manager

### Phase 3: UI Components (Week 3)
- Build Error Boundary components
- Create error notification system
- Implement fallback UIs
- Add user-facing error messages

### Phase 4: Debugging Tools (Week 4)
- Build debug logger
- Create development console commands
- Add React DevTools integration
- Implement performance monitoring

### Phase 5: Production Integration (Week 5)
- Integrate Sentry
- Set up error analytics
- Configure monitoring dashboards
- Implement alerting system

### Phase 6: Testing & Documentation (Week 6)
- Write unit tests
- Write property-based tests
- Write integration tests
- Create documentation

## Success Criteria

### Technical Success
- ✅ All errors caught and processed
- ✅ Error handling latency < 10ms
- ✅ Recovery success rate > 70%
- ✅ Zero sensitive data leaks
- ✅ Test coverage > 80%

### User Success
- ✅ Clear, actionable error messages
- ✅ Reduced support tickets for errors
- ✅ Improved error recovery rate
- ✅ Better user experience during errors

### Developer Success
- ✅ Faster debugging with enhanced tools
- ✅ Easier error tracking and resolution
- ✅ Comprehensive error documentation
- ✅ Reduced time to fix production issues
