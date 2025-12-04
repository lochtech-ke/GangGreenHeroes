// Comprehensive test configuration for V1.0 Major Release
// This file centralizes all testing configuration and setup

export interface TestConfig {
  // Environment settings
  environment: 'unit' | 'integration' | 'e2e';
  
  // Database settings
  database: {
    useMock: boolean;
    url?: string;
    anonKey?: string;
    serviceRoleKey?: string;
  };
  
  // Property-based testing settings
  propertyTesting: {
    numRuns: number;
    timeout: number;
    verbose: boolean;
  };
  
  // E2E testing settings
  e2e: {
    baseUrl: string;
    timeout: number;
    headless: boolean;
  };
  
  // Coverage settings
  coverage: {
    threshold: number;
    exclude: string[];
  };
  
  // Performance settings
  performance: {
    maxLoadTime: number;
    maxApiResponseTime: number;
  };
}

/**
 * Get test configuration based on environment
 */
export function getTestConfig(): TestConfig {
  const environment = (process.env.TEST_ENV as any) || 'unit';
  
  const baseConfig: TestConfig = {
    environment,
    database: {
      useMock: environment === 'unit',
      url: process.env.VITE_SUPABASE_TEST_URL || process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
      anonKey: process.env.VITE_SUPABASE_TEST_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key',
      serviceRoleKey: process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    propertyTesting: {
      numRuns: parseInt(process.env.FC_NUM_RUNS || '100', 10),
      timeout: 10000,
      verbose: process.env.NODE_ENV === 'development',
    },
    e2e: {
      baseUrl: process.env.VITE_TEST_BASE_URL || 'http://localhost:5173',
      timeout: 30000,
      headless: process.env.CI === 'true',
    },
    coverage: {
      threshold: 80,
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
      ],
    },
    performance: {
      maxLoadTime: 3000, // 3 seconds
      maxApiResponseTime: 500, // 500ms
    },
  };
  
  // Environment-specific overrides
  switch (environment) {
    case 'integration':
      baseConfig.database.useMock = false;
      baseConfig.propertyTesting.numRuns = 50; // Fewer runs for integration tests
      break;
      
    case 'e2e':
      baseConfig.database.useMock = false;
      baseConfig.propertyTesting.numRuns = 20; // Even fewer for E2E
      break;
      
    default: // unit
      baseConfig.database.useMock = true;
      break;
  }
  
  return baseConfig;
}

/**
 * Test environment setup utilities
 */
export const testEnvironment = {
  /**
   * Check if running in CI environment
   */
  isCI: () => process.env.CI === 'true',
  
  /**
   * Check if running in development mode
   */
  isDevelopment: () => process.env.NODE_ENV === 'development',
  
  /**
   * Check if verbose logging is enabled
   */
  isVerbose: () => process.env.TEST_VERBOSE === 'true',
  
  /**
   * Get test timeout based on environment
   */
  getTimeout: (defaultTimeout: number = 10000) => {
    if (testEnvironment.isCI()) {
      return defaultTimeout * 2; // Double timeout in CI
    }
    return defaultTimeout;
  },
  
  /**
   * Get number of property test runs based on environment
   */
  getPropertyTestRuns: (defaultRuns: number = 100) => {
    if (testEnvironment.isCI()) {
      return Math.min(defaultRuns, 50); // Limit runs in CI
    }
    return defaultRuns;
  },
};

/**
 * Test data constants
 */
export const testConstants = {
  // Valid test data
  validEmail: 'test@example.com',
  validPassword: 'testpassword123',
  validAge: 25,
  validAgeCohort: '25-34',
  validUserType: 'individual',
  
  // Invalid test data
  invalidEmail: 'invalid-email',
  invalidPassword: '123', // Too short
  invalidAge: 12, // Too young
  
  // Test IDs and UUIDs
  testUserId: '00000000-0000-0000-0000-000000000001',
  testCommunityId: '00000000-0000-0000-0000-000000000002',
  testMissionId: '00000000-0000-0000-0000-000000000003',
  
  // Geographic test data
  testCoordinates: {
    latitude: -1.2921, // Nairobi
    longitude: 36.8219,
  },
  
  // Date constants
  pastDate: '2023-01-01T00:00:00Z',
  futureDate: '2025-12-31T23:59:59Z',
};

/**
 * Test assertion helpers
 */
export const testAssertions = {
  /**
   * Assert that a value is a valid UUID
   */
  isValidUUID: (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },
  
  /**
   * Assert that a value is a valid email
   */
  isValidEmail: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  
  /**
   * Assert that a date is in the past
   */
  isInPast: (date: string | Date): boolean => {
    return new Date(date) < new Date();
  },
  
  /**
   * Assert that a date is in the future
   */
  isInFuture: (date: string | Date): boolean => {
    return new Date(date) > new Date();
  },
  
  /**
   * Assert that coordinates are valid
   */
  areValidCoordinates: (lat: number, lng: number): boolean => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  },
  
  /**
   * Assert that an age cohort is valid
   */
  isValidAgeCohort: (cohort: string): boolean => {
    return ['13-17', '18-24', '25-34', '35-49', '50+'].includes(cohort);
  },
  
  /**
   * Assert that a user type is valid
   */
  isValidUserType: (userType: string): boolean => {
    return ['individual', 'corporate', 'community', 'partner'].includes(userType);
  },
};

// Export the default configuration
export default getTestConfig();