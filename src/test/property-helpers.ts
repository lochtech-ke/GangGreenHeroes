import * as fc from 'fast-check';

// Property-based testing helpers and utilities

/**
 * Configuration for property-based tests
 */
export const propertyTestConfig = {
  numRuns: parseInt(process.env.FC_NUM_RUNS || '100', 10),
  timeout: 10000,
  verbose: process.env.NODE_ENV === 'development',
};

/**
 * Helper function to create property tests with consistent configuration
 */
export function createPropertyTest<T>(
  name: string,
  arbitrary: fc.Arbitrary<T>,
  predicate: (value: T) => boolean | Promise<boolean>,
  options: {
    featureName?: string;
    propertyNumber?: number;
    propertyText?: string;
    requirements?: string[];
    numRuns?: number;
  } = {}
) {
  const {
    featureName = 'v1-major-release',
    propertyNumber,
    propertyText,
    requirements = [],
    numRuns = propertyTestConfig.numRuns,
  } = options;

  // Create the property test comment for traceability
  const testComment = propertyNumber && propertyText
    ? `**Feature: ${featureName}, Property ${propertyNumber}: ${propertyText}**`
    : `**Feature: ${featureName}**`;

  const requirementsComment = requirements.length > 0
    ? `**Validates: Requirements ${requirements.join(', ')}**`
    : '';

  it(`${name} - ${testComment} ${requirementsComment}`.trim(), async () => {
    await fc.assert(
      fc.asyncProperty(arbitrary, predicate),
      {
        numRuns,
        timeout: propertyTestConfig.timeout,
        verbose: propertyTestConfig.verbose,
      }
    );
  });
}

/**
 * Helper for creating age cohort property tests
 */
export function createAgeCohortPropertyTest<T>(
  name: string,
  arbitrary: fc.Arbitrary<T>,
  predicate: (value: T) => boolean | Promise<boolean>,
  options: {
    propertyNumber?: number;
    propertyText?: string;
    requirements?: string[];
  } = {}
) {
  return createPropertyTest(name, arbitrary, predicate, {
    ...options,
    featureName: 'age-based-content-curation',
  });
}

/**
 * Helper for creating error handling property tests
 */
export function createErrorHandlingPropertyTest<T>(
  name: string,
  arbitrary: fc.Arbitrary<T>,
  predicate: (value: T) => boolean | Promise<boolean>,
  options: {
    propertyNumber?: number;
    propertyText?: string;
    requirements?: string[];
  } = {}
) {
  return createPropertyTest(name, arbitrary, predicate, {
    ...options,
    featureName: 'error-handling-debugging',
  });
}

/**
 * Helper for creating platform vision property tests
 */
export function createPlatformVisionPropertyTest<T>(
  name: string,
  arbitrary: fc.Arbitrary<T>,
  predicate: (value: T) => boolean | Promise<boolean>,
  options: {
    propertyNumber?: number;
    propertyText?: string;
    requirements?: string[];
  } = {}
) {
  return createPropertyTest(name, arbitrary, predicate, {
    ...options,
    featureName: 'platform-vision-2025',
  });
}

/**
 * Common arbitraries for property testing
 */
export const commonArbitraries = {
  // Age-related arbitraries
  validAge: fc.integer({ min: 13, max: 100 }),
  invalidAge: fc.oneof(
    fc.integer({ max: 12 }),
    fc.integer({ min: 101 }),
    fc.constant(null),
    fc.constant(undefined)
  ),
  
  // String arbitraries
  nonEmptyString: fc.string({ minLength: 1 }),
  shortString: fc.string({ minLength: 1, maxLength: 50 }),
  longString: fc.string({ minLength: 100, maxLength: 1000 }),
  
  // Email arbitraries
  validEmail: fc.emailAddress(),
  invalidEmail: fc.oneof(
    fc.string({ minLength: 1, maxLength: 10 }), // Too short
    fc.string().filter(s => !s.includes('@')), // No @ symbol
    fc.constant(''),
    fc.constant(null)
  ),
  
  // Numeric arbitraries
  positiveInteger: fc.integer({ min: 1 }),
  nonNegativeInteger: fc.integer({ min: 0 }),
  percentage: fc.float({ min: 0, max: 100 }),
  
  // Date arbitraries
  pastDate: fc.date({ max: new Date() }),
  futureDate: fc.date({ min: new Date() }),
  validDateString: fc.date().map(d => d.toISOString()),
  
  // Geographic arbitraries
  latitude: fc.float({ min: -90, max: 90 }),
  longitude: fc.float({ min: -180, max: 180 }),
  coordinates: fc.tuple(
    fc.float({ min: -90, max: 90 }),
    fc.float({ min: -180, max: 180 })
  ),
  
  // Content arbitraries
  htmlContent: fc.string().map(s => `<p>${s}</p>`),
  markdownContent: fc.string().map(s => `# Title\n\n${s}`),
  
  // Error arbitraries
  errorMessage: fc.string({ minLength: 5, maxLength: 200 }),
  errorCode: fc.string({ minLength: 3, maxLength: 20 }),
  
  // File arbitraries
  fileName: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.jpg`),
  fileSize: fc.integer({ min: 1, max: 10 * 1024 * 1024 }), // 1 byte to 10MB
  
  // URL arbitraries
  validUrl: fc.webUrl(),
  invalidUrl: fc.oneof(
    fc.string().filter(s => !s.startsWith('http')),
    fc.constant(''),
    fc.constant('not-a-url')
  ),
};

/**
 * Property test assertion helpers
 */
export const propertyAssertions = {
  /**
   * Assert that a value is within a valid range
   */
  isInRange: (value: number, min: number, max: number) => {
    return value >= min && value <= max;
  },

  /**
   * Assert that an array contains only unique values
   */
  hasUniqueValues: <T>(array: T[]) => {
    return new Set(array).size === array.length;
  },

  /**
   * Assert that a string is not empty after trimming
   */
  isNonEmptyString: (value: string) => {
    return typeof value === 'string' && value.trim().length > 0;
  },

  /**
   * Assert that an object has required properties
   */
  hasRequiredProperties: <T extends Record<string, any>>(
    obj: T,
    requiredProps: (keyof T)[]
  ) => {
    return requiredProps.every(prop => prop in obj && obj[prop] !== undefined);
  },

  /**
   * Assert that a date is valid
   */
  isValidDate: (date: Date | string) => {
    const d = new Date(date);
    return !isNaN(d.getTime());
  },

  /**
   * Assert that coordinates are valid
   */
  areValidCoordinates: (lat: number, lng: number) => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  },
};

/**
 * Helper to run property tests with error handling
 */
export async function runPropertyTest<T>(
  arbitrary: fc.Arbitrary<T>,
  predicate: (value: T) => boolean | Promise<boolean>,
  options: fc.Parameters<T> = {}
) {
  try {
    await fc.assert(
      fc.asyncProperty(arbitrary, predicate),
      {
        numRuns: propertyTestConfig.numRuns,
        timeout: propertyTestConfig.timeout,
        ...options,
      }
    );
  } catch (error) {
    // Enhanced error reporting for property test failures
    if (error instanceof Error && error.message.includes('Property failed')) {
      console.error('Property test failed with counterexample:', error.message);
      throw error;
    }
    throw error;
  }
}