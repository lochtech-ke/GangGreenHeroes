# Implementation Plan

- [x] 1. Fix import statement errors (highest priority)



  - Fix type vs value imports in tokenDistribution.service.ts
  - Change `import type` to regular `import` for TokenDistributionError and TokenDistributionErrorCode
  - These are runtime values (class and enum) that need value imports
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 2. Install and configure test type definitions


  - Ensure @types/node and vitest are in devDependencies
  - Update tsconfig.json to include "vitest/globals" in types array
  - Verify test files can access describe, it, and expect globals
  - _Requirements: 1.4, 5.1, 5.3_

- [ ] 3. Fix badge type errors
- [x] 3.1 Update badgeSvg.defs-fix.test.ts badge configurations


  - Change 'climate_champion' to valid AchievementType value
  - Add all required BadgeMetadata fields (tierLevel, forestName, achievementType, achievementCount, earnedDate, uniqueBadgeId, userId)
  - _Requirements: 2.1, 2.2, 2.3_

- [ ]* 3.2 Write property test for badge metadata completeness
  - **Property 2: Badge metadata completeness**
  - **Validates: Requirements 2.1, 2.3**

- [ ] 4. Fix service function signature errors
- [x] 4.1 Fix ggCoinService.creditCoins calls


  - Update heroPlatformIntegration.service.ts call to include all 5 parameters
  - Update heroRewardEngine.service.ts call to include all 5 parameters
  - Parameters: userId, amount, type, description, metadata
  - _Requirements: 4.1_

- [x] 4.2 Fix mission.service.enhanced.example.ts query typing


  - Properly destructure query result to get data and count
  - Ensure data variable is in scope before using in transformations
  - Add null checks for nested properties
  - _Requirements: 8.1, 8.2, 8.3_

- [ ]* 4.3 Write property test for null-safe data access
  - **Property 4: Null-safe data access**
  - **Validates: Requirements 8.1, 8.3**

- [ ] 5. Fix API client errors
- [x] 5.1 Fix RetryManager instantiation


  - Pass configuration object to constructor instead of individual parameters
  - Use object with maxRetries, initialDelay, maxDelay, backoffMultiplier properties
  - _Requirements: 4.4, 7.1_

- [x] 5.2 Fix CircuitBreaker method calls


  - Remove parameters from isOpen() calls (takes no arguments)
  - Remove parameters from reset() calls (takes no arguments)
  - Update internal tracking to not use operation keys if needed
  - _Requirements: 7.2_

- [x] 5.3 Fix rate limiting priority values


  - Change 'high' to valid priority type value
  - Check RateLimiter type definition for valid values
  - _Requirements: 7.3_

- [x] 5.4 Fix error logging context parameters


  - Ensure context objects match expected ErrorContext type
  - Pass context as single object parameter, not spread
  - _Requirements: 7.4_

- [ ] 6. Fix error handler type errors
- [x] 6.1 Fix errorHandler.ts Error to AppError conversions


  - Convert Error objects to AppError before passing to logError
  - Convert Error objects to AppError before passing to handlers
  - Add helper function toAppError if needed
  - _Requirements: 6.1_

- [ ]* 6.2 Write property test for error type conversion
  - **Property 3: Error type conversion**
  - **Validates: Requirements 6.1**

- [x] 6.3 Fix serviceErrorHandler.ts context property errors


  - Update ErrorContext type to include all used properties (fieldName, age, query, etc.)
  - Or create new error objects instead of mutating readonly context
  - Fix all 22 context-related errors
  - _Requirements: 6.2, 6.3_



- [ ] 6.4 Fix errorRecovery.ts parameter self-reference
  - Fix retryManager parameter that references itself in default value
  - Use undefined as default or restructure parameter
  - _Requirements: 7.1_


- [ ] 7. Fix test infrastructure errors
- [x] 7.1 Fix property-helpers.ts test function signatures

  - Update createPropertyTest to use correct fc.assert signature
  - Fix asyncProperty predicate type to return Promise<boolean | void>
  - Fix runPropertyTest to handle array vs tuple types correctly
  - _Requirements: 5.2, 5.5_

- [x] 7.2 Fix test/factories.ts fast-check constraints


  - Change 'max' to 'maxLength' in fc.string() call
  - Use correct constraint property names
  - _Requirements: 5.4_

- [x] 7.3 Fix test/database.test.ts mock function calls


  - Update mockClient.from() to take no arguments if that's the mock signature
  - Update mockClient.storage.from() similarly
  - Update mockClient.channel() similarly
  - Or fix mock implementations to accept arguments
  - _Requirements: 4.2_

- [x] 7.4 Fix colorContrast.test.ts test definitions


  - Ensure test file imports describe, it, expect from vitest
  - Or rely on vitest globals configuration from task 2
  - _Requirements: 5.3_

- [x] 8. Checkpoint - Verify all errors are resolved



  - Run `tsc --noEmit` and verify zero errors
  - Run `npm run build` and verify successful build
  - Run `npm test` and verify all tests pass
  - _Requirements: 1.1_

- [ ]* 8.1 Write compilation success test
  - **Property 1: TypeScript compilation succeeds**
  - **Validates: Requirements 1.1, 1.4, 5.1, 5.3**
