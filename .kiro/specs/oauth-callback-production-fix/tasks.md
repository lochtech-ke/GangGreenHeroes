# Implementation Plan: OAuth Callback Production Fix

- [x] 1. Update Vercel configuration for client-side routing





  - Update `vercel.json` with proper rewrite rules to serve React app for all non-API routes
  - Add cache control headers for OAuth callback route (no-cache)
  - Add cache control headers for favicon (long-term caching)
  - Exclude favicon.ico and static assets from rewriting
  - _Requirements: 1.1, 4.1, 4.2, 4.3_

- [ ]* 1.1 Write unit tests for Vercel configuration
  - Test rewrite rules match expected patterns
  - Test static asset exclusions work correctly
  - Test cache header configurations
  - _Requirements: 4.1, 4.3_

- [x] 2. Create and add favicon assets





  - Generate favicon.ico file with multiple sizes (16x16, 32x32, 48x48)
  - Create PNG fallback files (favicon-16x16.png, favicon-32x32.png)
  - Create Apple touch icon (apple-touch-icon.png)
  - Add favicon files to public directory
  - _Requirements: 2.1, 2.2_

- [x] 2.1 Update HTML to reference favicon properly


  - Add favicon link tags to index.html
  - Include PNG fallbacks for modern browsers
  - Add Apple touch icon reference
  - _Requirements: 2.1, 2.3_

- [ ]* 2.2 Write tests for favicon serving
  - Test favicon.ico returns 200 status code
  - Test PNG fallbacks are accessible
  - Test Apple touch icon is accessible
  - _Requirements: 2.2, 2.5_

- [x] 3. Create error logging utility service





  - Implement ErrorLogger class with sensitive data filtering
  - Add methods for OAuth error logging
  - Add methods for route error logging
  - Add production-safe error sanitization
  - Filter sensitive keys (access_token, refresh_token, password, secret)
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ]* 3.1 Write property test for sensitive data filtering
  - **Property 9: Sensitive data filtering**
  - **Validates: Requirements 3.4**
  - Generate random error objects with sensitive OAuth data
  - Verify sensitive information is redacted from logs
  - Verify debugging context is preserved

- [ ]* 3.2 Write property test for OAuth error logging completeness
  - **Property 6: OAuth error logging completeness**
  - **Validates: Requirements 3.1, 3.4**
  - Generate random OAuth callback errors
  - Verify logged information includes callback URL and parameters
  - Verify sensitive data is excluded from logs

- [ ]* 3.3 Write property test for session failure logging
  - **Property 7: Session failure logging**
  - **Validates: Requirements 3.2**
  - Generate random session establishment failures
  - Verify authentication state and context are logged
  - Verify sensitive information is filtered

- [x] 4. Enhance AuthCallbackPage component






  - Add comprehensive error handling for OAuth callback scenarios
  - Implement URL parameter parsing and validation
  - Add loading states with better UX
  - Add error states with retry options
  - Handle direct access without OAuth parameters
  - Add error logging using ErrorLogger service
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3_

- [ ]* 4.1 Write property test for token extraction completeness
  - **Property 2: Token extraction completeness**
  - **Validates: Requirements 1.2**
  - Generate random OAuth callback URLs with various parameter combinations
  - Verify all required authentication parameters are correctly extracted
  - Verify missing parameters are detected appropriately

- [ ]* 4.2 Write property test for valid token session establishment
  - **Property 3: Valid token session establishment**
  - **Validates: Requirements 1.3**
  - Generate random valid access tokens
  - Verify session establishment succeeds
  - Verify redirect to dashboard occurs

- [ ]* 4.3 Write property test for error handling consistency
  - **Property 4: Error handling consistency**
  - **Validates: Requirements 1.4**
  - Generate random OAuth callback error scenarios
  - Verify meaningful error messages are displayed
  - Verify retry options are provided

- [ ]* 4.4 Write property test for invalid parameter handling
  - **Property 11: Invalid parameter handling**
  - **Validates: Requirements 5.3**
  - Generate random malformed OAuth parameters
  - Verify system handles errors gracefully without crashing
  - Verify appropriate error messages are shown

- [x] 5. Add origin validation for security




  - Implement origin validation in AuthCallbackPage
  - Check request origin against allowed domains
  - Add security logging for suspicious requests
  - Handle cross-origin requests appropriately
  - _Requirements: 5.4_

- [ ]* 5.1 Write property test for origin validation security
  - **Property 12: Origin validation security**
  - **Validates: Requirements 5.4**
  - Generate random request origins (valid and invalid)
  - Verify valid origins are accepted
  - Verify invalid origins are rejected appropriately

- [x] 6. Implement redirect destination preservation




  - Add support for preserving intended destination in OAuth flow
  - Store destination before OAuth redirect
  - Restore destination after successful authentication
  - Handle edge cases where destination is invalid
  - _Requirements: 5.5_

- [ ]* 6.1 Write property test for redirect destination preservation
  - **Property 13: Redirect destination preservation**
  - **Validates: Requirements 5.5**
  - Generate random intended destinations
  - Verify destinations are preserved through OAuth flow
  - Verify invalid destinations are handled safely

- [x] 7. Add 404 error context logging




  - Implement logging for 404 errors during OAuth flow
  - Capture requested URL and referrer information
  - Add context about OAuth flow state
  - Use ErrorLogger service for consistent formatting
  - _Requirements: 3.3_

- [ ]* 7.1 Write property test for 404 error context logging
  - **Property 8: 404 error context logging**
  - **Validates: Requirements 3.3**
  - Generate random 404 scenarios during OAuth flow
  - Verify requested URL and referrer are captured
  - Verify sufficient context is logged for debugging

- [x] 8. Test authentication flow compatibility





  - Verify existing email/password authentication still works
  - Verify existing Web3 authentication still works
  - Test that routing changes don't interfere with other auth methods
  - Add regression tests for existing functionality
  - _Requirements: 4.4_

- [ ]* 8.1 Write property test for authentication flow compatibility
  - **Property 10: Authentication flow compatibility**
  - **Validates: Requirements 4.4**
  - Generate random authentication scenarios for all methods
  - Verify routing changes don't break existing flows
  - Verify session establishment works consistently

- [x] 9. Add OAuth callback routing property test





  - Test that production routing serves React app for OAuth callbacks
  - Verify 404 errors are eliminated for valid callback URLs
  - Test various OAuth parameter combinations
  - _Requirements: 1.1, 4.3_

- [ ]* 9.1 Write property test for OAuth callback routing consistency
  - **Property 1: OAuth callback routing consistency**
  - **Validates: Requirements 1.1, 4.3**
  - Generate random valid OAuth callback URLs
  - Verify production server serves React application
  - Verify no 404 errors are returned

- [x] 10. Add favicon availability property test




  - Test favicon serving across different routes
  - Verify 200 status codes for favicon requests
  - Test fallback behavior when favicon is missing
  - _Requirements: 2.1_

- [x]* 10.1 Write property test for favicon availability across routes

  - **Property 5: Favicon availability across routes**
  - **Validates: Requirements 2.1**
  - Generate random page routes
  - Verify favicon requests return valid files with 200 status
  - Verify consistent favicon serving across all routes

- [x] 11. Update deployment documentation




  - Document Vercel configuration changes
  - Add favicon asset requirements
  - Document OAuth callback URL configuration
  - Add troubleshooting guide for production issues
  - _Requirements: 4.1, 4.5_

- [ ] 12. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Manual production testing
  - Test Google OAuth flow on production URL
  - Verify favicon loads without 404 errors
  - Test error scenarios (cancelled auth, invalid parameters)
  - Test direct access to callback URL
  - Verify error logging works correctly
  - Test on multiple browsers and devices
  - _Requirements: All_