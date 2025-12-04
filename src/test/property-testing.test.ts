import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  createPropertyTest, 
  createAgeCohortPropertyTest,
  createErrorHandlingPropertyTest,
  createPlatformVisionPropertyTest,
  commonArbitraries,
  propertyAssertions,
  runPropertyTest 
} from './property-helpers';
import { 
  userFactory, 
  contentItemFactory, 
  errorFactory,
  ageCohortArbitrary,
  contentTypeArbitrary 
} from './factories';

// Test the property-based testing infrastructure

describe('Property-Based Testing Infrastructure', () => {
  it('should have fast-check configured correctly', () => {
    expect(fc).toBeDefined();
    expect(fc.assert).toBeDefined();
    expect(fc.property).toBeDefined();
    expect(fc.asyncProperty).toBeDefined();
  });

  it('should have property test helpers available', () => {
    expect(createPropertyTest).toBeDefined();
    expect(createAgeCohortPropertyTest).toBeDefined();
    expect(createErrorHandlingPropertyTest).toBeDefined();
    expect(createPlatformVisionPropertyTest).toBeDefined();
  });

  it('should have common arbitraries working', () => {
    // Test each common arbitrary
    const validAge = fc.sample(commonArbitraries.validAge, 1)[0];
    expect(validAge).toBeGreaterThanOrEqual(13);
    expect(validAge).toBeLessThanOrEqual(100);

    const email = fc.sample(commonArbitraries.validEmail, 1)[0];
    expect(email).toContain('@');
    expect(email).toContain('.');

    const positiveInt = fc.sample(commonArbitraries.positiveInteger, 1)[0];
    expect(positiveInt).toBeGreaterThan(0);

    const percentage = fc.sample(commonArbitraries.percentage, 1)[0];
    expect(percentage).toBeGreaterThanOrEqual(0);
    expect(percentage).toBeLessThanOrEqual(100);

    const [lat, lng] = fc.sample(commonArbitraries.coordinates, 1)[0];
    expect(lat).toBeGreaterThanOrEqual(-90);
    expect(lat).toBeLessThanOrEqual(90);
    expect(lng).toBeGreaterThanOrEqual(-180);
    expect(lng).toBeLessThanOrEqual(180);
  });

  it('should have property assertions working', () => {
    expect(propertyAssertions.isInRange(50, 0, 100)).toBe(true);
    expect(propertyAssertions.isInRange(150, 0, 100)).toBe(false);

    expect(propertyAssertions.hasUniqueValues([1, 2, 3])).toBe(true);
    expect(propertyAssertions.hasUniqueValues([1, 2, 2])).toBe(false);

    expect(propertyAssertions.isNonEmptyString('hello')).toBe(true);
    expect(propertyAssertions.isNonEmptyString('')).toBe(false);
    expect(propertyAssertions.isNonEmptyString('   ')).toBe(false);

    expect(propertyAssertions.hasRequiredProperties({ a: 1, b: 2 }, ['a', 'b'] as const)).toBe(true);
    expect(propertyAssertions.hasRequiredProperties({ a: 1 }, ['a'] as const)).toBe(true);

    expect(propertyAssertions.isValidDate(new Date())).toBe(true);
    expect(propertyAssertions.isValidDate('2023-01-01')).toBe(true);
    expect(propertyAssertions.isValidDate('invalid')).toBe(false);

    expect(propertyAssertions.areValidCoordinates(45, 90)).toBe(true);
    expect(propertyAssertions.areValidCoordinates(100, 90)).toBe(false);
  });

  it('should have test factories working', () => {
    const user = fc.sample(userFactory, 1)[0];
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('user_type');
    expect(['individual', 'corporate', 'community', 'partner']).toContain(user.user_type);

    const content = fc.sample(contentItemFactory, 1)[0];
    expect(content).toHaveProperty('id');
    expect(content).toHaveProperty('type');
    expect(content).toHaveProperty('title');
    expect(['initiative', 'social_post', 'challenge', 'educational', 'mission']).toContain(content.type);

    const error = fc.sample(errorFactory, 1)[0];
    expect(error).toHaveProperty('name');
    expect(error).toHaveProperty('message');
    expect(error).toHaveProperty('severity');
    expect(['low', 'medium', 'high', 'critical']).toContain(error.severity);
  });

  it('should be able to run property tests', async () => {
    await runPropertyTest(
      fc.integer({ min: 1, max: 100 }),
      (value) => value > 0,
      { numRuns: 10 }
    );
  });
});

describe('Property Test Examples', () => {
  // Example property tests to verify the infrastructure works

  createPropertyTest(
    'should validate that all generated ages are in valid range',
    commonArbitraries.validAge,
    (age) => age >= 13 && age <= 100,
    {
      propertyNumber: 1,
      propertyText: 'Generated ages are within valid range',
      requirements: ['Infrastructure'],
      numRuns: 20,
    }
  );

  createPropertyTest(
    'should validate that all generated emails contain required characters',
    commonArbitraries.validEmail,
    (email) => email.includes('@') && email.includes('.') && email.length > 5,
    {
      propertyNumber: 2,
      propertyText: 'Generated emails have valid format',
      requirements: ['Infrastructure'],
      numRuns: 20,
    }
  );

  createPropertyTest(
    'should validate that coordinates are within valid ranges',
    commonArbitraries.coordinates,
    ([lat, lng]) => propertyAssertions.areValidCoordinates(lat, lng),
    {
      propertyNumber: 3,
      propertyText: 'Generated coordinates are valid',
      requirements: ['Infrastructure'],
      numRuns: 20,
    }
  );

  createAgeCohortPropertyTest(
    'should validate age cohort generation',
    ageCohortArbitrary,
    (cohort) => ['13-17', '18-24', '25-34', '35-49', '50+'].includes(cohort),
    {
      propertyNumber: 4,
      propertyText: 'Generated age cohorts are valid',
      requirements: ['Content Curation'],
    }
  );

  createErrorHandlingPropertyTest(
    'should validate error object structure',
    errorFactory,
    (error) => {
      return propertyAssertions.hasRequiredProperties(error, ['name', 'message', 'severity']) &&
             propertyAssertions.isNonEmptyString(error.name) &&
             propertyAssertions.isNonEmptyString(error.message) &&
             ['low', 'medium', 'high', 'critical'].includes(error.severity);
    },
    {
      propertyNumber: 5,
      propertyText: 'Generated errors have valid structure',
      requirements: ['Error Handling'],
    }
  );

  createPlatformVisionPropertyTest(
    'should validate user object structure',
    userFactory,
    (user) => {
      return propertyAssertions.hasRequiredProperties(user, ['id', 'email', 'user_type']) &&
             propertyAssertions.isNonEmptyString(user.email) &&
             user.email.includes('@') &&
             ['individual', 'corporate', 'community', 'partner'].includes(user.user_type);
    },
    {
      propertyNumber: 6,
      propertyText: 'Generated users have valid structure',
      requirements: ['Platform Vision'],
    }
  );

  createPropertyTest(
    'should validate content type generation',
    contentTypeArbitrary,
    (contentType) => ['initiative', 'social_post', 'challenge', 'educational', 'mission'].includes(contentType),
    {
      propertyNumber: 7,
      propertyText: 'Generated content types are valid',
      requirements: ['Content Curation'],
      numRuns: 20,
    }
  );
});

describe('Property Test Error Handling', () => {
  it('should handle property test failures gracefully', async () => {
    try {
      await runPropertyTest(
        fc.integer(),
        (value) => value < 0, // This will fail for positive integers
        { numRuns: 10 }
      );
      // Should not reach here
      expect(false).toBe(true);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.message).toContain('Property failed');
      }
    }
  });

  it('should handle async property test failures', async () => {
    try {
      await runPropertyTest(
        fc.string(),
        async (value) => {
          await new Promise(resolve => setTimeout(resolve, 1));
          return value.length < 0; // Always false
        },
        { numRuns: 5 }
      );
      // Should not reach here
      expect(false).toBe(true);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});