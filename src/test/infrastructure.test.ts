import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { createPropertyTest, commonArbitraries } from './property-helpers';
import { userFactory, ageCohortArbitrary } from './factories';
import { createMockSupabaseClient } from './utils';
import { setupTestDatabase } from './database.config';
import { testUtils, testConfig } from './test-runner';

// Test to verify testing infrastructure is working correctly

describe('Testing Infrastructure', () => {
  it('should have Vitest working', () => {
    expect(true).toBe(true);
  });

  it('should have fast-check available', () => {
    const result = fc.sample(fc.integer(), 1);
    expect(result).toHaveLength(1);
    expect(typeof result[0]).toBe('number');
  });

  it('should have test factories working', () => {
    const user = fc.sample(userFactory, 1)[0];
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('user_type');
  });

  it('should have mock Supabase client working', () => {
    const mockClient = createMockSupabaseClient();
    expect(mockClient).toHaveProperty('auth');
    expect(mockClient).toHaveProperty('from');
    expect(mockClient.auth.getUser).toBeDefined();
  });

  it('should have common arbitraries available', () => {
    const age = fc.sample(commonArbitraries.validAge, 1)[0];
    expect(age).toBeGreaterThanOrEqual(13);
    expect(age).toBeLessThanOrEqual(100);
  });

  it('should have age cohort arbitrary working', () => {
    const cohort = fc.sample(ageCohortArbitrary, 1)[0];
    expect(['13-17', '18-24', '25-34', '35-49', '50+']).toContain(cohort);
  });

  it('should have test database helper working', () => {
    const { helper } = setupTestDatabase(true);
    expect(helper).toBeDefined();
    expect(helper.getClient).toBeDefined();
    expect(helper.cleanup).toBeDefined();
  });

  it('should have test utilities available', () => {
    expect(testUtils).toBeDefined();
    expect(testUtils.waitFor).toBeDefined();
    expect(testUtils.delay).toBeDefined();
    expect(testUtils.generateTestId).toBeDefined();
  });

  it('should have test configuration available', () => {
    expect(testConfig).toBeDefined();
    expect(testConfig.defaultTimeout).toBeGreaterThan(0);
    expect(testConfig.propertyTest.numRuns).toBeGreaterThan(0);
  });

  it('should generate unique test IDs', () => {
    const id1 = testUtils.generateTestId();
    const id2 = testUtils.generateTestId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^test-\d+-[a-z0-9]+$/);
  });
});

describe('Property-Based Testing Infrastructure', () => {
  createPropertyTest(
    'should validate positive integers',
    commonArbitraries.positiveInteger,
    (value) => value > 0,
    {
      propertyNumber: 1,
      propertyText: 'Positive integers are greater than zero',
      requirements: ['Infrastructure Test'],
      numRuns: 10, // Reduced for quick test
    }
  );

  createPropertyTest(
    'should validate email format',
    commonArbitraries.validEmail,
    (email) => email.includes('@') && email.includes('.'),
    {
      propertyNumber: 2,
      propertyText: 'Valid emails contain @ and .',
      requirements: ['Infrastructure Test'],
      numRuns: 10, // Reduced for quick test
    }
  );

  createPropertyTest(
    'should validate coordinate ranges',
    fc.tuple(commonArbitraries.latitude, commonArbitraries.longitude),
    ([lat, lng]) => lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180,
    {
      propertyNumber: 3,
      propertyText: 'Coordinates are within valid ranges',
      requirements: ['Infrastructure Test'],
      numRuns: 10, // Reduced for quick test
    }
  );
});