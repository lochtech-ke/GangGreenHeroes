import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { setupTestDatabase, TestDatabaseHelper } from './database.config';
import { setupTestEnvironment } from './utils';

// Global test runner configuration

let testDbHelper: TestDatabaseHelper | null = null;

/**
 * Global test setup - runs once before all tests
 */
beforeAll(async () => {
  // Setup test environment
  setupTestEnvironment();

  // Initialize test database helper
  const { helper } = setupTestDatabase(true); // Use mock by default
  testDbHelper = helper;

  console.log('Test environment initialized');
});

/**
 * Global test cleanup - runs once after all tests
 */
afterAll(async () => {
  if (testDbHelper) {
    await testDbHelper.cleanup();
    testDbHelper = null;
  }

  console.log('Test environment cleaned up');
});

/**
 * Test setup - runs before each test
 */
beforeEach(() => {
  // Reset any global state if needed
  // Clear localStorage/sessionStorage
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
    window.sessionStorage.clear();
  }
});

/**
 * Test cleanup - runs after each test
 */
afterEach(() => {
  // Additional cleanup if needed
});

/**
 * Get the test database helper
 */
export function getTestDbHelper(): TestDatabaseHelper | null {
  return testDbHelper;
}

/**
 * Test utilities for common test patterns
 */
export const testUtils = {
  /**
   * Wait for a condition to be true
   */
  waitFor: async (
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> => {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  },

  /**
   * Create a delay
   */
  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Generate a unique test ID
   */
  generateTestId: (): string => {
    return `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  },

  /**
   * Create a test timeout
   */
  timeout: (ms: number): Promise<never> => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Test timed out after ${ms}ms`)), ms);
    });
  },
};

/**
 * Test environment configuration
 */
export const testConfig = {
  // Default timeout for async operations
  defaultTimeout: 10000,
  
  // Property-based test configuration
  propertyTest: {
    numRuns: parseInt(process.env.FC_NUM_RUNS || '100', 10),
    timeout: 10000,
    verbose: process.env.NODE_ENV === 'development',
  },
  
  // Database test configuration
  database: {
    useMock: process.env.TEST_USE_MOCK_DB !== 'false',
    cleanupTimeout: 5000,
  },
  
  // E2E test configuration
  e2e: {
    baseUrl: process.env.VITE_TEST_BASE_URL || 'http://localhost:5173',
    timeout: 30000,
  },
};