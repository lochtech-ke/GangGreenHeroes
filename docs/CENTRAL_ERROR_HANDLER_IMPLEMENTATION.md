# Central Error Handler Implementation

## Overview

This document describes the implementation of the central error handler system for the V1.0 Major Release. The error handler provides centralized error processing, categorization, sanitization, rate limiting, and context management.

## Implementation Date

November 30, 2025

## Components Implemented

### 1. ErrorHandler (`src/utils/errorHandler.ts`)

The central error handler provides a unified pipeline for processing all application errors.

**Key Features:**
- **Centralized Processing**: All errors flow through a single handler (Requirement C1.1)
- **Error Categorization**: Automatically categorizes errors by type (network, auth, validation, database, web3, badge, curation, runtime) (Requirement C1.2)
- **Sanitization**: Removes sensitive data before logging (Requirement C1.4)
- **Rate Limiting**: Prevents log flooding from repeated errors (Requirement C14.1)
- **Custom Handlers**: Supports registering custom handlers for specific error types
- **Severity Filtering**: Only processes errors above a configurable severity threshold
- **Global Error Handling**: Automatically catches unhandled promise rejections and global errors

**Usage Example:**
```typescript
import { errorHandler, handleError } from './utils/errorHandler';

// Handle an error
try {
  // Some operation
} catch (error) {
  handleError(error, {
    component: 'UserProfile',
    action: 'loadData',
    userId: 'user-123',
  });
}

// Register a custom handler
errorHandler.registerHandler('network', (error) => {
  // Custom handling for network errors
  console.log('Network error occurred:', error.message);
});

// Configure severity threshold
errorHandler.setSeverityThreshold(ErrorSeverity.MEDIUM);
```

### 2. ErrorContextManager (`src/utils/errorContext.ts`)

Manages error context collection including breadcrumbs, navigation history, and component hierarchy.

**Key Features:**
- **Breadcrumb Tracking**: Records the last 10 user actions leading to an error (Requirement C15.2)
- **Navigation History**: Tracks the last 10 routes visited (Requirement C15.1)
- **API Call Tracking**: Logs API requests with status codes (Requirement C15.3)
- **Form Interaction Tracking**: Records form events (focus, blur, change, submit, error) (Requirement C15.4)
- **Component Lifecycle Tracking**: Tracks component mount, unmount, update, and error events (Requirement C15.5)
- **Session Management**: Generates unique session IDs and request IDs
- **Automatic Navigation Tracking**: Integrates with browser history API

**Usage Example:**
```typescript
import {
  trackUserAction,
  trackApiCall,
  trackFormInteraction,
  trackComponentLifecycle,
  getErrorContext,
} from './utils/errorContext';

// Track user actions
trackUserAction('Click submit button', { buttonId: 'submit-form' });

// Track API calls
trackApiCall('POST', '/api/users', 201, { userId: 'user-123' });

// Track form interactions
trackFormInteraction('loginForm', 'submit');

// Track component lifecycle
trackComponentLifecycle('UserProfile', 'mount');

// Get complete error context
const context = getErrorContext({
  component: 'UserProfile',
  action: 'loadData',
});
```

### 3. ErrorRateLimiter (`src/utils/errorRateLimiter.ts`)

Prevents error log flooding by rate limiting identical errors.

**Key Features:**
- **Window-Based Limiting**: Limits errors within a time window (Requirement C14.1)
- **Suppression Tracking**: Counts suppressed errors (Requirement C14.3)
- **Automatic Reset**: Resets limits after suppression duration (Requirement C14.4)
- **Critical Error Bypass**: Allows critical errors to bypass rate limits (Requirement C14.5)
- **Per-Error-Code Tracking**: Tracks different error codes independently
- **Configurable Thresholds**: Adjustable window size, max errors, and suppression duration
- **Automatic Cleanup**: Periodically cleans up expired states

**Usage Example:**
```typescript
import { ErrorRateLimiter } from './utils/errorRateLimiter';

const rateLimiter = new ErrorRateLimiter({
  windowSize: 60000, // 1 minute
  maxErrorsPerWindow: 10,
  suppressionDuration: 300000, // 5 minutes
  criticalErrorsBypass: true,
});

// Check if error should be logged
if (rateLimiter.shouldLog('NETWORK_ERROR')) {
  console.error('Network error occurred');
  rateLimiter.recordError('NETWORK_ERROR');
}

// Get suppressed count
const suppressed = rateLimiter.getSuppressedCount('NETWORK_ERROR');
console.log(`${suppressed} errors suppressed`);

// Force log a critical error
rateLimiter.forceLog('CRITICAL_ERROR');
```

## Integration with Existing Systems

### Error Types

The error handler integrates with the existing error type system defined in `src/types/errors.ts`:

- `AppError`: Base error class with code, severity, context, and recoverability
- `NetworkError`: Network-related errors
- `AuthError`: Authentication and authorization errors
- `ValidationError`: Input validation errors
- `DatabaseError`: Database operation errors
- `Web3Error`: Blockchain and wallet errors
- `BadgeError`: Badge generation and management errors
- `CurationError`: Content curation errors

### Sanitization

The error handler uses the existing sanitization utilities from `src/utils/errorLogging.ts`:

- `sanitizeString()`: Removes sensitive data from strings
- `sanitizeObject()`: Deep sanitization of objects
- `sanitizeWeb3Data()`: Web3-specific sanitization
- `sanitizeAgeData()`: Age data sanitization

## Testing

Comprehensive unit tests have been implemented for all components:

### ErrorHandler Tests (`src/utils/errorHandler.test.ts`)
- ✅ Error categorization for all error types
- ✅ Sensitive data sanitization
- ✅ Severity threshold filtering
- ✅ Custom handler execution
- ✅ Rate limiting integration
- ✅ Tracking control
- ✅ Error conversion from standard Error
- ✅ Context merging

**Test Results:** 24/24 tests passing

### ErrorContextManager Tests (`src/utils/errorContext.test.ts`)
- ✅ Breadcrumb management and limiting
- ✅ User action tracking
- ✅ API call tracking
- ✅ Form interaction tracking
- ✅ Component lifecycle tracking
- ✅ Navigation history management
- ✅ Component hierarchy tracking
- ✅ Context generation
- ✅ Session and request ID generation
- ✅ Reset functionality

**Test Results:** 25/25 tests passing

### ErrorRateLimiter Tests (`src/utils/errorRateLimiter.test.ts`)
- ✅ Basic rate limiting
- ✅ Suppression counting
- ✅ Window expiration
- ✅ Suppression duration
- ✅ Configuration management
- ✅ State management
- ✅ Suppression status checking
- ✅ Statistics reporting
- ✅ Critical error bypass
- ✅ Force logging
- ✅ Reset functionality
- ✅ Cleanup on destroy

**Test Results:** 24/24 tests passing

**Total Test Coverage:** 73/73 tests passing (100%)

## Requirements Validation

### Requirement C1.1: Centralized Error Management ✅
- All errors are processed through the ErrorHandler singleton
- Global handlers catch unhandled promise rejections and errors
- Consistent error processing pipeline

### Requirement C1.2: Error Categorization ✅
- Automatic categorization by error type
- Support for 8 error categories: network, authentication, validation, database, web3, badge, curation, runtime
- Inference from error message when type is unknown

### Requirement C1.3: Error Context ✅
- Context includes timestamp, user ID, component, action, route
- Breadcrumbs track last 10 user actions
- Navigation history tracks last 10 routes
- Component hierarchy preserved

### Requirement C1.4: Sensitive Data Sanitization ✅
- Integration with existing sanitization utilities
- Sanitizes error messages, context, and stack traces
- Removes tokens, passwords, API keys, PII, Web3 addresses, age data

### Requirement C14.1: Error Rate Limiting ✅
- Window-based rate limiting
- Configurable thresholds
- Per-error-code tracking

### Requirement C14.2: Rate Limit Summary ✅
- Logs summary message when rate limit exceeded
- Tracks suppressed error counts

### Requirement C14.3: Suppression Counting ✅
- Tracks number of suppressed errors per code
- Reports suppressed count when logging resumes

### Requirement C14.4: Rate Limit Reset ✅
- Automatic reset after suppression duration
- Logs total suppressed errors on reset

### Requirement C14.5: Critical Error Bypass ✅
- Critical errors bypass rate limiting
- Configurable bypass behavior

### Requirement C15.1: Route and Navigation History ✅
- Captures current route
- Maintains last 10 navigation entries
- Automatic tracking via history API integration

### Requirement C15.2: Breadcrumb Tracking ✅
- Records last 10 user actions
- Includes timestamp, category, message, level, and data
- Automatic breadcrumb for navigation events

### Requirement C15.3: API Call Context ✅
- Logs request method, endpoint, status code
- Includes request/response data (sanitized)
- Tracks API call timing

### Requirement C15.4: Form State Capture ✅
- Tracks form interactions (focus, blur, change, submit, error)
- Captures form name and field name
- Sanitizes form data

### Requirement C15.5: Component Hierarchy ✅
- Maintains component hierarchy in context
- Tracks component lifecycle events
- Preserves hierarchy through error propagation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Code                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      ErrorHandler                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. Ensure AppError                                   │  │
│  │  2. Check Severity Threshold                          │  │
│  │  3. Categorize Error                                  │  │
│  │  4. Check Rate Limiting ──────────────────────┐      │  │
│  │  5. Sanitize Error                             │      │  │
│  │  6. Log Error                                  │      │  │
│  │  7. Execute Custom Handlers                    │      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │                        │
                            ▼                        ▼
┌──────────────────────────────────┐  ┌──────────────────────┐
│     ErrorContextManager          │  │  ErrorRateLimiter    │
│  - Breadcrumbs                   │  │  - Window Tracking   │
│  - Navigation History            │  │  - Suppression       │
│  - Component Hierarchy           │  │  - Statistics        │
│  - Session/Request IDs           │  │  - Bypass Logic      │
└──────────────────────────────────┘  └──────────────────────┘
```

## Performance Considerations

### ErrorHandler
- Singleton pattern ensures single instance
- Minimal overhead per error (< 10ms)
- Async logging to prevent blocking

### ErrorContextManager
- Fixed-size breadcrumb buffer (10 items)
- Fixed-size navigation history (10 items)
- Efficient array operations (shift/push)

### ErrorRateLimiter
- Map-based state storage for O(1) lookups
- Periodic cleanup of expired states (every 60 seconds)
- Minimal memory footprint per error code

## Future Enhancements

1. **Database Persistence**: Store error logs in Supabase for analytics
2. **Sentry Integration**: Send errors to Sentry in production (Task 6)
3. **Error Recovery**: Implement automatic recovery strategies (Task 6)
4. **Error Analytics**: Build analytics dashboard (Task 31)
5. **Error Notifications**: User-facing error notifications (Task 29)
6. **Performance Monitoring**: Integrate with performance tracking

## Related Tasks

- ✅ Task 4.1: Create structured error types
- ✅ Task 4.3: Implement sanitization utilities
- ✅ Task 5.1: Create ErrorHandler class
- ✅ Task 5.3: Implement error context system
- ✅ Task 5.5: Implement error rate limiting
- ⏳ Task 6: Implement error recovery system (Next)
- ⏳ Task 7: Build debug logger system
- ⏳ Task 8: Implement React Error Boundaries

## Conclusion

The central error handler system provides a robust foundation for error management in the V1.0 release. All requirements have been met, comprehensive tests are passing, and the system is ready for integration with other error handling components (recovery, debugging, boundaries, Sentry).

The implementation follows best practices:
- Singleton pattern for centralized management
- Separation of concerns (handler, context, rate limiting)
- Comprehensive sanitization to protect sensitive data
- Flexible configuration and extensibility
- Thorough testing with 100% test pass rate

Next steps involve implementing the error recovery system (Task 6) and integrating with React Error Boundaries (Task 8).
