# Testing Infrastructure

This directory contains the comprehensive testing infrastructure for the V1.0 Major Release of the GangGreen platform, implementing Task 3 from the implementation plan.

## Testing Framework Overview

The platform uses a multi-layered testing approach:

- **Unit Tests**: Vitest with React Testing Library
- **Property-Based Tests**: fast-check library (100+ iterations per property)
- **Integration Tests**: Vitest with Supabase test client
- **E2E Tests**: Playwright for complete user journeys

## Test Structure

```
src/
├── test/
│   ├── setup.ts              # Global test configuration and mocks
│   ├── utils.ts              # Test utilities and helper functions
│   ├── factories.ts          # Test data factories using fast-check
│   ├── property-helpers.ts   # Property-based testing utilities
│   ├── database.config.ts    # Test database configuration
│   ├── test-runner.ts        # Global test runner setup
│   ├── infrastructure.test.ts # Testing infrastructure tests
│   ├── property-testing.test.ts # Property-based testing examples
│   ├── database.test.ts      # Database configuration tests
│   ├── supabase-test.ts      # Legacy test database configuration
│   └── README.md             # This file
├── services/
│   └── *.service.test.ts     # Service unit tests
│   └── *.property.test.ts    # Property-based tests
└── components/
    └── **/*.test.tsx         # Component tests
tests/
└── e2e/
    ├── test-setup.ts         # E2E test fixtures and utilities
    ├── setup.spec.ts         # E2E infrastructure tests
    └── *.spec.ts             # End-to-end tests
```

## Running Tests

```bash
# Unit and integration tests
npm test                    # Run all tests once
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report

# Property-based tests
FC_NUM_RUNS=100 npm test   # Run with specific number of property test iterations

# E2E tests
npm run test:e2e           # Run E2E tests
npm run test:e2e:ui        # Run E2E tests with UI
npm run test:e2e:headed    # Run E2E tests in headed mode
```

## Test Framework

- **Vitest**: Fast unit test framework
- **Testing Library**: React component testing
- **jsdom**: Browser environment simulation

## Writing Tests

### Unit Tests

Unit tests focus on testing individual functions and services in isolation.

Example:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { authService } from './auth.service';

describe('AuthService', () => {
  it('should login user with valid credentials', async () => {
    const result = await authService.login({
      email: 'test@example.com',
      password: 'password123',
    });
    
    expect(result.error).toBeNull();
  });
});
```

### Component Tests

Component tests verify UI behavior and user interactions.

Example:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from './LoginForm';

it('should render login form', () => {
  render(<LoginForm />);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
});
```

## Mocking

### Mocking Services

```typescript
vi.mock('../../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
  },
}));
```

### Mocking Supabase

```typescript
vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));
```

## Test Coverage

The platform aims for 80% code coverage focusing on:
- Core business logic
- Authentication flows
- User interactions
- Error handling

## Best Practices

1. **Test behavior, not implementation** - Focus on what the code does, not how
2. **Use descriptive test names** - Clearly state what is being tested
3. **Arrange-Act-Assert** - Structure tests with setup, execution, and verification
4. **Mock external dependencies** - Isolate the code under test
5. **Test error cases** - Verify error handling works correctly
6. **Keep tests simple** - One assertion per test when possible

## Authentication Tests

### Auth Service Tests (`auth.service.test.ts`)

Tests for the authentication service covering:
- User registration
- User login
- Logout functionality
- Password reset requests
- Role checking (hasRole, hasAnyRole, isAdmin, isOrganization)

### Login Form Tests (`LoginForm.test.tsx`)

Tests for the login form component:
- Form rendering
- Field validation
- Successful login flow
- Error handling
- Forgot password functionality
- Loading states

### Register Form Tests (`RegisterForm.test.tsx`)

Tests for the registration form component:
- Form rendering with all fields
- Required field validation
- Password strength validation
- Password confirmation matching
- Email format validation
- Role selection
- Organization field conditional display
- Successful registration flow
- Error handling

## RLS Policy Testing

Row Level Security (RLS) policies should be tested at the database level:

1. **User Profile Access** - Users can only view/edit their own profiles
2. **Initiative Access** - Public read, organization write
3. **Tree Access** - Public read, authenticated write
4. **Transaction Access** - Users can only view their own transactions

These tests require a test Supabase instance and are typically run as integration tests.

## Continuous Integration

Tests run automatically on:
- Pull requests
- Main branch commits
- Pre-deployment checks

## Troubleshooting

### Tests Not Running

1. Check that dependencies are installed: `npm install`
2. Verify vitest.config.ts exists
3. Check test file naming (*.test.ts or *.test.tsx)

### Mock Issues

1. Ensure mocks are defined before imports
2. Clear mocks between tests with `vi.clearAllMocks()`
3. Check mock return values match expected types

### Component Test Failures

1. Verify component is wrapped with necessary providers
2. Check for async operations - use `waitFor()`
3. Ensure proper cleanup with `afterEach(cleanup)`

## Requirements Fulfilled

These tests fulfill **Requirement 1.1, 1.2, and 1.5** from the requirements document:

✅ Unit tests for auth service functions  
✅ Integration tests for login/register flows  
✅ Validation testing  
✅ Error handling verification  
✅ Role-based access control testing  

## Future Enhancements

- E2E tests with Playwright
- Visual regression testing
- Performance testing
- Accessibility testing
- API integration tests
- Database RLS policy tests
