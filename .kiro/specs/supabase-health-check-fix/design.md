# Design Document

## Overview

This design addresses the critical issue where the Supabase health check blocks user authentication by timing out. The current implementation performs a synchronous health check before login attempts, which prevents users from accessing the platform when the service is slow but functional. The solution involves making health checks non-blocking, increasing timeout values, and ensuring authentication operations proceed independently of health check status.

## Architecture

### Current Architecture Issues

1. **Blocking Health Check**: The auth service waits for health check completion before proceeding with login
2. **Aggressive Timeout**: 1000ms timeout is too short for real-world network conditions
3. **Tight Coupling**: Authentication logic is tightly coupled to health check results
4. **Poor Error Handling**: Health check failures prevent login attempts even when Supabase is functional

### Proposed Architecture

1. **Asynchronous Health Checks**: Health checks run in background without blocking authentication
2. **Increased Timeout**: 5000ms timeout provides realistic window for network latency
3. **Loose Coupling**: Authentication proceeds independently of health check status
4. **Graceful Degradation**: Health check failures are logged but don't prevent operations

## Components and Interfaces

### 1. Health Check Utility (`src/utils/supabaseHealth.ts`)

**Modifications:**
- Increase timeout from 1000ms to 5000ms
- Add performance warning threshold at 2000ms
- Maintain existing caching mechanism (10 second TTL)
- Keep existing metrics tracking

**Interface:**
```typescript
// Existing interface - no changes needed
export async function checkSupabaseHealth(forceCheck?: boolean): Promise<boolean>
export function clearHealthCheckCache(): void
export function getLastHealthCheck(): HealthCheckResult | null
export function getHealthCheckMetrics(): HealthCheckMetrics
export function resetHealthCheckMetrics(): void
export function logHealthCheckMetrics(): void
```

### 2. Auth Service (`src/services/auth.service.ts`)

**Modifications:**
- Remove blocking health check from login flow
- Implement background health check that doesn't await completion
- Remove health check from registration flow (already non-blocking)
- Ensure authentication proceeds regardless of health check status

**Modified Methods:**
```typescript
async login(credentials: LoginCredentials): Promise<AuthResponse> {
  // Start health check in background without awaiting
  checkSupabaseHealth().then(isHealthy => {
    // Log result for monitoring
  }).catch(err => {
    // Log error for monitoring
  });
  
  // Proceed with login immediately
  const { data, error } = await withRetry(
    () => supabase.auth.signInWithPassword(credentials),
    DEFAULT_RETRY_CONFIG,
    'signInWithPassword'
  );
  
  // ... rest of login logic
}
```

### 3. Login Form (`src/components/auth/LoginForm.tsx`)

**No Changes Required:**
- Component already handles auth service responses correctly
- Error messages are already user-friendly
- Loading states are properly managed

## Data Models

### HealthCheckResult

```typescript
interface HealthCheckResult {
  isHealthy: boolean;
  timestamp: number;
  duration: number;
  error?: string;
}
```

**No changes needed** - existing model is sufficient.

### HealthCheckMetrics

```typescript
interface HealthCheckMetrics {
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  averageDuration: number;
  lastCheckTime: number;
}
```

**No changes needed** - existing model is sufficient.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Login proceeds regardless of health check status

*For any* login attempt with valid or invalid credentials, the authentication operation should proceed and complete independently of the health check status, whether the health check succeeds, fails, or times out.

**Validates: Requirements 1.1, 1.2, 2.1, 2.2**

### Property 2: Successful authentication is independent of health check failure

*For any* valid user credentials, when the login operation succeeds, the user should be authenticated regardless of whether the health check failed or timed out.

**Validates: Requirements 1.3**

### Property 3: Login errors are displayed when authentication fails

*For any* invalid credentials, when both health check and login fail, the system should display the authentication error message (not the health check error) to the user.

**Validates: Requirements 1.4**

### Property 4: Health check results are logged without affecting operations

*For any* health check that completes after an operation starts, the result should be logged for monitoring purposes without affecting the outcome of the operation.

**Validates: Requirements 1.5, 2.3**

### Property 5: Health check cache reduces redundant checks

*For any* sequence of operations within the cache TTL period (10 seconds), subsequent health checks should reuse the cached result without performing additional network requests.

**Validates: Requirements 2.4**

### Property 6: Cache expiration triggers new health checks

*For any* cached health check result, when the TTL expires, the next health check should perform a new network request and update the cache.

**Validates: Requirements 2.5**

### Property 7: Performance warnings are logged for slow checks

*For any* health check that completes in more than 2000ms but less than 5000ms, the system should log a performance warning with the duration.

**Validates: Requirements 3.2**

### Property 8: Optimal performance is recognized

*For any* health check that completes within 1000ms, the system should consider it optimal performance and not log any warnings.

**Validates: Requirements 3.3**

### Property 9: Timeouts are recorded in metrics

*For any* health check that exceeds the timeout threshold, the system should record the timeout event in the metrics with failure status.

**Validates: Requirements 3.4**

### Property 10: Aggregate statistics are logged for multiple failures

*For any* sequence of 5 or more health checks where the success rate falls below 50%, the system should log aggregate statistics including success rate, total checks, and average duration.

**Validates: Requirements 3.5, 4.5**

### Property 11: Health check initiation is logged

*For any* health check operation, the system should log the initiation with a timestamp before performing the check.

**Validates: Requirements 4.1**

### Property 12: Health check completion is logged with metrics

*For any* health check that completes (success or failure), the system should log the duration and result status.

**Validates: Requirements 4.2**

### Property 13: Health check errors are logged with details

*For any* health check that fails, the system should log both the error message and error type for debugging purposes.

**Validates: Requirements 4.3**

### Property 14: Metrics API provides complete data

*For any* request for health check metrics, the system should return all required fields: success rate, average duration, failure count, successful checks, and total checks.

**Validates: Requirements 4.4**

### Property 15: User account creation precedes badge generation

*For any* registration operation, the user account should be created and committed to the database before badge generation is attempted.

**Validates: Requirements 5.1**

### Property 16: Registration succeeds despite badge generation failure

*For any* registration where badge generation fails, the system should log the error, complete the registration, and return the user object.

**Validates: Requirements 5.2, 5.4**

### Property 17: Fallback notification is created on badge failure

*For any* registration where badge generation fails, the system should create a fallback welcome notification for the user.

**Validates: Requirements 5.3**

### Property 18: Success path creates both badge and notification

*For any* registration where badge generation succeeds, the system should create both the badge SVG and the welcome notification.

**Validates: Requirements 5.5**

### Property 19: Health check uses correct Supabase method

*For any* health check operation, the system should call auth.getSession() to verify service availability.

**Validates: Requirements 6.1**

### Property 20: Successful session check indicates healthy service

*For any* auth.getSession() call that returns without error, the health check should classify the service as healthy.

**Validates: Requirements 6.2**

### Property 21: Session errors indicate unhealthy service

*For any* auth.getSession() call that returns an error, the health check should classify the service as unhealthy and log the error.

**Validates: Requirements 6.3**

### Property 22: Timeouts indicate unhealthy service

*For any* auth.getSession() call that exceeds the timeout threshold, the health check should classify the service as unhealthy and record the timeout.

**Validates: Requirements 6.4**

### Property 23: Cached results are reused within TTL

*For any* health check result that is cached, subsequent health checks within the TTL period should return the cached result without calling auth.getSession().

**Validates: Requirements 6.5**

## Error Handling

### Health Check Errors

1. **Timeout Errors**: Log warning, mark as unhealthy, cache result
2. **Network Errors**: Log error details, mark as unhealthy, cache result
3. **Unexpected Errors**: Log full error, mark as unhealthy, cache result

### Authentication Errors

1. **Invalid Credentials**: Display user-friendly message, don't retry
2. **Network Errors**: Retry with exponential backoff (existing retry logic)
3. **Service Unavailable**: Retry with exponential backoff (existing retry logic)

### Badge Generation Errors

1. **Generation Failure**: Log error, create fallback notification, continue registration
2. **Storage Failure**: Log warning, continue registration
3. **Notification Failure**: Log warning, continue registration

## Testing Strategy

### Unit Tests

1. **Health Check Timeout Configuration**: Verify timeout is set to 5000ms
2. **Health Check Method**: Verify auth.getSession() is called
3. **Cache TTL**: Verify cache expires after 10 seconds
4. **Performance Thresholds**: Verify warnings at 2000ms, optimal at <1000ms

### Property-Based Tests

Property-based tests will use **fast-check** library for TypeScript. Each test will run a minimum of 100 iterations to ensure comprehensive coverage across random inputs.

1. **Property 1 Test**: Generate random credentials, mock health check with random status (success/failure/timeout), verify login proceeds
2. **Property 2 Test**: Generate valid credentials, force health check failure, verify authentication succeeds
3. **Property 3 Test**: Generate invalid credentials, force health check failure, verify auth error is displayed
4. **Property 4 Test**: Generate random operations, delay health check completion, verify operations complete independently
5. **Property 5 Test**: Generate rapid sequence of operations, verify only one health check occurs within TTL
6. **Property 6 Test**: Generate operations with time delays, verify new check after TTL expiration
7. **Property 7 Test**: Generate health checks with durations between 2000-5000ms, verify warnings are logged
8. **Property 8 Test**: Generate health checks with durations <1000ms, verify no warnings
9. **Property 9 Test**: Generate health checks that timeout, verify metrics record failures
10. **Property 10 Test**: Generate sequences with >50% failure rate, verify aggregate logging
11. **Property 11 Test**: Generate health checks, verify initiation logging
12. **Property 12 Test**: Generate health checks, verify completion logging with metrics
13. **Property 13 Test**: Generate failing health checks, verify error details in logs
14. **Property 14 Test**: Request metrics, verify all required fields are present
15. **Property 15 Test**: Generate registrations, verify user creation before badge generation
16. **Property 16 Test**: Generate registrations with badge failures, verify registration succeeds
17. **Property 17 Test**: Generate registrations with badge failures, verify fallback notification
18. **Property 18 Test**: Generate registrations with badge success, verify both artifacts created
19. **Property 19 Test**: Generate health checks, verify auth.getSession() is called
20. **Property 20 Test**: Mock successful session check, verify healthy classification
21. **Property 21 Test**: Mock session errors, verify unhealthy classification
22. **Property 22 Test**: Mock session timeouts, verify unhealthy classification
23. **Property 23 Test**: Generate rapid checks, verify cache reuse within TTL

### Integration Tests

1. **Login Flow**: Test complete login with background health check
2. **Registration Flow**: Test complete registration with badge generation
3. **Health Check Monitoring**: Test metrics collection over multiple operations
4. **Cache Behavior**: Test cache expiration and refresh

### Manual Testing

1. **Slow Network**: Test login with simulated network latency
2. **Service Degradation**: Test login when Supabase responds slowly
3. **Complete Outage**: Test error messages when Supabase is unavailable
4. **Badge Generation**: Test registration with and without badge generation
