# Design Document

## Overview

This design addresses the systematic resolution of 274 TypeScript compilation errors across 68 files in the GangGreen platform. The errors fall into distinct categories that can be addressed through targeted fixes: unused code removal, type alignment, null safety improvements, module export corrections, and proper class instantiation patterns.

The approach prioritizes automated fixes where possible (unused imports), followed by systematic manual corrections organized by error type. Each category of errors will be addressed in a specific order to minimize cascading fixes and ensure type safety is restored efficiently.

## Architecture

### Error Classification System

Errors are grouped into 8 primary categories based on TypeScript error codes:

1. **Code Cleanup (TS6133)**: 76 unused import/variable errors
2. **Function Signature Mismatches (TS2345, TS2554)**: 72 argument-related errors
3. **Property Access Errors (TS2339, TS2551)**: 51 property existence errors
4. **Module Resolution (TS2305, TS2724)**: 13 import/export errors
5. **Null Safety (TS18047, TS18046)**: 11 null/undefined handling errors
6. **Class Instantiation (TS2511)**: 14 abstract class errors
7. **Type Assignment (TS2322, TS2739, TS2741)**: 15 type compatibility errors
8. **Type Comparison (TS2678)**: 3 literal type comparison errors

### Fix Strategy

The fix strategy follows a dependency-aware order:

```
1. Module Exports (Foundation)
   ↓
2. Type Definitions (Core Types)
   ↓
3. Null Safety (Runtime Safety)
   ↓
4. Property Access (Object Safety)
   ↓
5. Function Signatures (API Contracts)
   ↓
6. Type Assignments (Value Flow)
   ↓
7. Class Instantiation (OOP Patterns)
   ↓
8. Code Cleanup (Final Polish)
```

This order ensures that foundational issues (missing exports) are fixed before dependent issues (incorrect imports), and that type-critical fixes precede cosmetic cleanup.

## Components and Interfaces

### Error Analysis Tool

```typescript
interface ErrorAnalysis {
  errorCode: string;
  count: number;
  files: string[];
  category: ErrorCategory;
  priority: number;
  automatable: boolean;
}

interface FixPlan {
  category: ErrorCategory;
  errors: ErrorAnalysis[];
  strategy: FixStrategy;
  estimatedComplexity: 'low' | 'medium' | 'high';
}
```

### Module Export Fixer

Handles TS2305, TS2724 errors by:
- Identifying missing exports in source modules
- Correcting export name mismatches
- Updating re-export statements in index files

```typescript
interface ExportFix {
  file: string;
  missingExports: string[];
  incorrectNames: Map<string, string>; // wrong -> correct
  action: 'add' | 'rename' | 'remove';
}
```

### Type Safety Enhancer

Handles TS18047, TS18046, TS2339 errors by:
- Adding null/undefined checks
- Implementing optional chaining
- Adding type guards for unknown types

```typescript
interface SafetyFix {
  file: string;
  line: number;
  issue: 'null' | 'undefined' | 'unknown';
  solution: 'guard' | 'optional-chain' | 'type-narrow' | 'assertion';
}
```

### Function Signature Aligner

Handles TS2345, TS2554 errors by:
- Matching argument types to parameters
- Adjusting argument counts
- Adding type conversions where needed

```typescript
interface SignatureFix {
  file: string;
  function: string;
  line: number;
  issue: 'type-mismatch' | 'arg-count' | 'missing-optional';
  expectedSignature: string;
  actualCall: string;
}
```

## Data Models

### Error Report Structure

```typescript
interface CompilationErrorReport {
  totalErrors: number;
  errorsByCategory: Map<ErrorCategory, number>;
  errorsByFile: Map<string, number>;
  criticalFiles: string[]; // Files with >5 errors
  timestamp: Date;
}

interface FixProgress {
  category: ErrorCategory;
  totalErrors: number;
  fixedErrors: number;
  remainingErrors: number;
  filesModified: string[];
  verificationStatus: 'pending' | 'passed' | 'failed';
}
```

### Type Definition Corrections

Key type definition issues identified:

1. **petition.types.ts**: Missing exports
   - `PetitionRow` → Should export or use `Petition`
   - `PetitionSignatureRow` → Should export or use `PetitionSignature`
   - `PetitionWithSignature` → Doesn't exist, should be `PetitionWithDetails`
   - `CreatePetitionParams` → Should be `CreatePetitionData`
   - `SignPetitionParams` → Should be `SignPetitionData`
   - `PetitionServiceResponse` → Missing export

2. **Database column naming**: Several errors reference wrong column names
   - `green_coin_reward` vs `gg_coin_reward`
   - Need to verify actual database schema

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Zero compilation errors invariant

*For any* source file in the codebase, after applying fixes, running the TypeScript compiler should produce zero errors for that file.

**Validates: Requirements 9.1**

### Property 2: Import-export consistency

*For any* import statement, the imported member must exist as an export in the target module with the exact same name.

**Validates: Requirements 4.1, 4.2**

### Property 3: Null safety preservation

*For any* value that may be null or undefined, accessing its properties must be preceded by a null/undefined check or use optional chaining.

**Validates: Requirements 5.1, 5.2**

### Property 4: Function signature compliance

*For any* function call, the number and types of arguments provided must match the function's parameter signature.

**Validates: Requirements 2.1, 2.2**

### Property 5: Property existence guarantee

*For any* property access on an object, the property must exist in the object's type definition or be accessed using optional chaining.

**Validates: Requirements 3.1, 3.3**

### Property 6: Type assignment compatibility

*For any* variable assignment, the assigned value's type must be assignable to the variable's declared type.

**Validates: Requirements 7.1, 7.2**

### Property 7: Functionality preservation

*For any* file that is modified to fix TypeScript errors, the runtime behavior and functionality must remain unchanged.

**Validates: Requirements 9.3**

### Property 8: Unused import removal safety

*For any* import statement marked as unused, removing it must not cause compilation errors in type annotations or other type-only usage.

**Validates: Requirements 1.3**

### Property 9: Optional parameter handling

*For any* function with optional parameters, calls to that function must either provide the parameter or handle the undefined case appropriately.

**Validates: Requirements 2.4**

### Property 10: Database schema alignment

*For any* database column reference in code, the column name must match the actual column name in the database schema.

**Validates: Requirements 3.4**

### Property 11: Abstract class test implementation

*For any* abstract class that needs testing, test files must create concrete implementations rather than attempting direct instantiation.

**Validates: Requirements 6.2**

## Error Handling

### Compilation Verification

After each category of fixes:
1. Run `npx tsc --noEmit` to verify error reduction
2. Run `npm run build` to ensure build succeeds
3. Run existing tests to verify no functionality regression
4. Document any new errors introduced by fixes

### Fix Rollback Strategy

If fixes introduce new errors or break functionality:
1. Identify the specific change that caused the issue
2. Revert that change
3. Apply an alternative fix strategy
4. Re-verify compilation

### Error Categorization Failures

If an error doesn't fit expected categories:
1. Document the error pattern
2. Create a custom fix strategy
3. Apply fix manually with extra verification
4. Update categorization for future reference

## Testing Strategy

### Compilation Testing

**Primary verification method**: TypeScript compiler output

```bash
# Before fixes
npx tsc --noEmit > errors-before.txt

# After each category
npx tsc --noEmit > errors-after-category-N.txt

# Compare error counts
diff errors-before.txt errors-after-category-N.txt
```

### Unit Testing

After fixes are applied:
- Run existing unit test suite: `npm run test`
- Verify all tests pass
- Check test coverage remains above 80%
- No new test failures introduced

### Build Testing

Verify production build:
```bash
npm run build
npm run preview
```

### Manual Verification

For critical files with many changes:
1. Review the diff carefully
2. Verify type annotations are correct
3. Check that null safety doesn't break logic
4. Ensure removed imports weren't actually needed

### Property-Based Testing

While this is primarily a refactoring task, we will verify properties through:

1. **Compilation property tests**: Scripts that verify zero errors
2. **Import consistency tests**: Automated checks for export existence
3. **Type safety tests**: Verify null checks are in place where needed

The testing framework will be **Vitest** (already configured in the project).

Each fix category will have verification steps:
- Automated: TypeScript compiler checks
- Manual: Code review for complex type changes
- Regression: Existing test suite execution

## Implementation Notes

### Automated vs Manual Fixes

**Automated** (can use find-replace or scripts):
- TS6133: Unused imports (ESLint auto-fix)
- TS2724: Export name corrections (known mappings)
- Simple property name typos (known corrections)

**Manual** (require case-by-case analysis):
- TS2345: Type mismatches (may need type conversions)
- TS2339: Property access (may need optional chaining)
- TS18047: Null safety (requires logic understanding)
- TS2511: Abstract class instantiation (needs test refactoring)

### Critical Files

Files with highest error counts (priority targets):
1. `src/services/ggCoin.service.test.ts` (46 errors)
2. `src/services/ambassador.service.ts` (32 errors)
3. `src/utils/devModeGuards.ts` (40 errors)
4. `src/services/contentCuration.service.ts` (23 errors)
5. `src/services/engagementTracker.service.test.ts` (33 errors)

### Database Schema Verification

Before fixing property access errors, verify actual database column names:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name IN ('gg_coin_transactions', 'initiatives', 'missions');
```

This ensures property name corrections match the actual schema.
