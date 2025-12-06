# Design Document

## Overview

This design addresses 160 TypeScript compilation errors across 30 files in the GangGreen platform. The errors fall into distinct categories that require systematic fixes: import type misuse, function signature mismatches, missing type definitions, type assertion errors, and test infrastructure issues. The solution involves correcting import statements, updating function calls to match signatures, installing missing type definitions, fixing type assertions, and ensuring proper error handling patterns.

## Architecture

The fix strategy follows a layered approach:

1. **Type System Layer**: Fix type definitions and imports
2. **Service Layer**: Correct function signatures and service method calls
3. **Test Infrastructure Layer**: Install and configure test type definitions
4. **Error Handling Layer**: Fix error type conversions and context handling
5. **Utility Layer**: Correct API client and helper function signatures

## Components and Interfaces

### 1. Import Statement Corrections

**Component**: Type vs Value Import Fixer

**Interface**:
```typescript
// Before (incorrect - type import for runtime value)
import type { TokenDistributionError, TokenDistributionErrorCode } from '../types';

// After (correct - value import for runtime instantiation)
import { TokenDistributionError, TokenDistributionErrorCode } from '../types';
```

**Affected Files**:
- `src/services/tokenDistribution.service.ts` (39 errors)

### 2. Badge Type Corrections

**Component**: Badge Configuration Type Fixer

**Interface**:
```typescript
// Complete BadgeMetadata with all required fields
interface BadgeMetadata {
  badgeName: string;
  tierLevel: number;
  forestName: string;
  achievementType: string;
  achievementCount: number;
  earnedDate: string;
  uniqueBadgeId: string;
  userId: string;
}

// Valid AchievementType values
type AchievementType =
  | 'tree_planter'
  | 'carbon_warrior'
  | 'water_guardian'
  | 'biodiversity_champion'
  | 'community_leader'
  | 'climate_hero'
  | 'forest_protector'
  | 'green_ambassador'
  | 'welcome_badge'
  | 'ganggreen_hero';
```

**Affected Files**:
- `src/services/badgeSvg.defs-fix.test.ts` (3 errors)

### 3. Service Function Signature Corrections

**Component**: GG Coin Service Call Fixer

**Interface**:
```typescript
// Correct signature
async creditCoins(
  userId: string,
  amount: number,
  type: string,
  description: string,
  metadata?: any
): Promise<GGCoinTransaction | null>

// Correct usage
const result = await ggCoinService.creditCoins(
  userId,
  amount,
  'github_contribution',
  'Tokens awarded for contribution',
  { cycle_id: cycleId }
);
```

**Affected Files**:
- `src/services/heroPlatformIntegration.service.ts` (1 error)
- `src/services/heroRewardEngine.service.ts` (1 error)

### 4. Test Infrastructure Setup

**Component**: Test Type Definitions Installer

**Required Packages**:
```json
{
  "devDependencies": {
    "@types/node": "^20.0.0",
    "vitest": "^1.0.0"
  }
}
```

**Configuration**: `tsconfig.json`
```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "node"]
  }
}
```

**Affected Files**:
- `src/test/property-helpers.ts` (4 errors)
- `src/utils/colorContrast.test.ts` (21 errors)

### 5. API Client Corrections

**Component**: API Client Constructor and Method Fixer

**Interface**:
```typescript
// RetryManager constructor
constructor(config?: {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
})

// CircuitBreaker methods
isOpen(): boolean  // No parameters
reset(): void      // No parameters
```

**Affected Files**:
- `src/utils/apiClient.ts` (14 errors)

### 6. Error Handler Corrections

**Component**: Error Type Converter

**Interface**:
```typescript
// Convert Error to AppError before passing to handlers
function toAppError(error: Error): AppError {
  if (error instanceof AppError) {
    return error;
  }
  return new AppError(
    error.message,
    'UNKNOWN_ERROR',
    'medium',
    false,
    { originalError: error }
  );
}
```

**Affected Files**:
- `src/utils/errorHandler.ts` (3 errors)
- `src/utils/serviceErrorHandler.ts` (22 errors)

### 7. Mission Service Query Fixes

**Component**: Query Result Type Handler

**Interface**:
```typescript
// Properly typed query result
const { data, count, error } = await query;

if (error) throw error;

const result = {
  data: data || [],
  count: count || 0
};

// Use data in scope
const enrichedData = result.data.map(item => ({
  ...item,
  organizer: item.organizer ? {
    id: item.organizer.id,
    display_name: item.organizer.user_profiles?.display_name || 'Unknown'
  } : null
}));
```

**Affected Files**:
- `src/services/mission.service.enhanced.example.ts` (6 errors)

## Data Models

### Error Classification

```typescript
interface TypeScriptError {
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
  category: ErrorCategory;
}

type ErrorCategory =
  | 'import_type_mismatch'
  | 'function_signature_mismatch'
  | 'missing_type_definitions'
  | 'type_assertion_error'
  | 'test_infrastructure'
  | 'error_handling'
  | 'api_client'
  | 'query_typing';
```

### Fix Strategy

```typescript
interface FixStrategy {
  category: ErrorCategory;
  priority: 'high' | 'medium' | 'low';
  automated: boolean;
  steps: string[];
  affectedFiles: string[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Acceptance Criteria Testing Prework

Based on the requirements analysis, most acceptance criteria are validated by the TypeScript compiler itself at compile time. However, some criteria are testable through examples or properties:

**Testable as Examples:**
- 1.1: Zero compilation errors (run tsc and check exit code)
- 1.4: Test type definitions available (test files compile)
- 5.1: Vitest types installed (package.json check)
- 5.3: Test globals available (test files compile)

**Testable as Properties:**
- 2.1/2.3: Badge metadata completeness (all required fields present)
- 6.1: Error type conversion (Error → AppError)
- 8.1: Query result null handling
- 8.3: Nested property access safety

**Not Directly Testable (Compiler-Validated):**
- All import statement correctness (1.2, 3.1-3.3)
- All function signature matching (1.3, 4.1-4.4, 7.1-7.2)
- All type assertions (1.5)
- All enum value usage (2.2, 6.4, 7.3)
- All compile-time type checking (2.4, 3.4, 5.2, 5.4, 5.5, 6.2-6.3, 7.4, 8.2, 8.4)

### Property Reflection

After reviewing the testable properties, we can consolidate:

1. **Property 2.1 and 2.3 are redundant** - both test badge metadata completeness. We'll keep one comprehensive property.
2. **Property 8.1 and 8.3 overlap** - both test safe data access. We'll combine into one property about null-safe data handling.
3. **Example tests 1.1, 1.4, 5.1, 5.3 can be combined** - all verify successful compilation. We'll have one example test that runs tsc.

**Final Properties:**
- Property 1: Compilation succeeds (example)
- Property 2: Badge metadata completeness (property)
- Property 3: Error type conversion (property)
- Property 4: Null-safe data access (property)

### Correctness Properties

Property 1: TypeScript compilation succeeds
*For the* entire codebase, running the TypeScript compiler should produce zero errors and exit with code 0
**Validates: Requirements 1.1, 1.4, 5.1, 5.3**

Property 2: Badge metadata completeness
*For any* badge configuration created in the system, the metadata object should contain all required fields: badgeName, tierLevel, forestName, achievementType, achievementCount, earnedDate, uniqueBadgeId, and userId
**Validates: Requirements 2.1, 2.3**

Property 3: Error type conversion
*For any* Error object passed to error handlers, the system should convert it to an AppError instance before processing, ensuring all handlers receive properly typed error objects with code, severity, and context properties
**Validates: Requirements 6.1**

Property 4: Null-safe data access
*For any* database query result, accessing nested properties should handle null/undefined values gracefully without throwing runtime errors, using optional chaining or explicit null checks
**Validates: Requirements 8.1, 8.3**

## Error Handling

### Compilation Error Handling

The fix process will handle errors in this order:

1. **Import Errors** (highest priority)
   - Fix type vs value imports first
   - These block other fixes

2. **Type Definition Errors**
   - Install missing @types packages
   - Update tsconfig.json

3. **Function Signature Errors**
   - Update function calls to match signatures
   - Add missing parameters

4. **Type Assertion Errors**
   - Fix incompatible type casts
   - Add proper type guards

5. **Test Infrastructure Errors**
   - Configure test globals
   - Fix test helper signatures

### Validation Strategy

After each category of fixes:
1. Run `tsc --noEmit` to check for remaining errors
2. Verify error count decreases
3. Ensure no new errors are introduced
4. Run affected tests to verify functionality

## Testing Strategy

### Unit Testing

Unit tests will verify specific fixes:

1. **Import Statement Tests**
   - Verify TokenDistributionError can be instantiated
   - Verify TokenDistributionErrorCode can be used in switch statements

2. **Badge Configuration Tests**
   - Create badge configs with complete metadata
   - Verify all required fields are present

3. **Service Call Tests**
   - Test ggCoinService.creditCoins with all parameters
   - Verify transaction objects are returned

4. **Error Handler Tests**
   - Pass Error objects to handlers
   - Verify conversion to AppError

### Property-Based Testing

Property-based tests will verify general correctness:

1. **Property 2: Badge Metadata Completeness**
   - Generator: Create random badge configurations
   - Predicate: All required metadata fields are present and non-null
   - Library: fast-check
   - Iterations: 100

2. **Property 3: Error Type Conversion**
   - Generator: Create random Error objects
   - Predicate: After passing to error handler, result is AppError with required properties
   - Library: fast-check
   - Iterations: 100

3. **Property 4: Null-Safe Data Access**
   - Generator: Create query results with various null/undefined nested properties
   - Predicate: Accessing nested properties doesn't throw errors
   - Library: fast-check
   - Iterations: 100

### Integration Testing

Integration tests will verify the complete fix:

1. **Compilation Test**
   - Run `tsc --noEmit`
   - Assert exit code is 0
   - Assert no error output

2. **Build Test**
   - Run `npm run build`
   - Assert build succeeds
   - Assert dist files are generated

3. **Test Suite Execution**
   - Run `npm test`
   - Assert all tests pass
   - Assert no type errors in test files

### Testing Tools

- **TypeScript Compiler**: `tsc` for type checking
- **Vitest**: Test runner with TypeScript support
- **fast-check**: Property-based testing library
- **ts-node**: Execute TypeScript directly for validation scripts

### Test Coverage Goals

- All 30 affected files should compile without errors
- All 160 errors should be resolved
- No new errors should be introduced
- Existing tests should continue to pass
- New property tests should achieve 100% pass rate

### Continuous Validation

After fixes are applied:
1. Run `tsc --noEmit` in CI/CD pipeline
2. Fail builds on any TypeScript errors
3. Run property tests as part of test suite
4. Monitor for regression in error count
