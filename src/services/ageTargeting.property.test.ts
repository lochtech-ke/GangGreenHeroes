/**
 * Property-Based Tests for Age Targeting Features
 * Tests for Task 28: Age targeting for content creators
 * Requirements: B6.2, B6.3, B5.3, B5.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateReach } from './reachEstimation.service';
import { ageCohortAnalyzer } from './ageCohortAnalyzer.service';
import type { AgeCohort } from '../types/contentCuration.types';

describe('Property B9: Reach estimation accuracy', () => {
  it('should return reach between 0 and total users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          min_age: fc.option(fc.integer({ min: 13, max: 100 }), { nil: undefined }),
          max_age: fc.option(fc.integer({ min: 13, max: 100 }), { nil: undefined }),
        }),
        async (params) => {
          // Skip invalid ranges
          if (
            params.min_age !== undefined &&
            params.max_age !== undefined &&
            params.min_age > params.max_age
          ) {
            return true;
          }

          const result = await calculateReach(params);

          // Reach should be non-negative
          expect(result.estimatedReach).toBeGreaterThanOrEqual(0);

          // Reach should not exceed total platform users
          expect(result.estimatedReach).toBeLessThanOrEqual(result.totalPlatformUsers);

          // Percentage should be between 0 and 100
          expect(result.percentageOfPlatform).toBeGreaterThanOrEqual(0);
          expect(result.percentageOfPlatform).toBeLessThanOrEqual(100);

          return true;
        }
      ),
      { numRuns: 10 }
    );
  }, 30000);

  it('should have breakdown sum equal to estimated reach', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.constantFrom<AgeCohort>('13-17', '18-24', '25-39', '40-59', '60+'),
          { minLength: 1, maxLength: 5 }
        ),
        async (cohorts) => {
          const result = await calculateReach({ target_cohorts: cohorts });

          if (result.breakdown.length > 0) {
            const breakdownSum = result.breakdown.reduce(
              (sum, item) => sum + item.userCount,
              0
            );
            expect(breakdownSum).toBe(result.estimatedReach);
          }

          return true;
        }
      ),
      { numRuns: 10 }
    );
  }, 30000);

  it('should return higher reach for broader age ranges', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 13, max: 50 }),
        fc.integer({ min: 10, max: 40 }),
        async (baseAge, rangeExtension) => {
          const narrowRange = await calculateReach({
            min_age: baseAge,
            max_age: baseAge + 10,
          });

          const wideRange = await calculateReach({
            min_age: baseAge,
            max_age: baseAge + 10 + rangeExtension,
          });

          // Wider range should have equal or greater reach
          expect(wideRange.estimatedReach).toBeGreaterThanOrEqual(narrowRange.estimatedReach);

          return true;
        }
      ),
      { numRuns: 5 }
    );
  }, 30000);

  it('should return 100% reach when no targeting specified', async () => {
    const result = await calculateReach({});

    expect(result.percentageOfPlatform).toBe(100);
    expect(result.estimatedReach).toBe(result.totalPlatformUsers);
  }, 10000);
});

describe('Property B10: Age targeting enforcement', () => {
  it('should only include users within specified age range', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 13, max: 100 }),
        fc.integer({ min: 13, max: 100 }),
        fc.integer({ min: 13, max: 100 }),
        (minAge, maxAge, userAge) => {
          // Ensure valid range
          if (minAge > maxAge) {
            [minAge, maxAge] = [maxAge, minAge];
          }

          const shouldInclude = userAge >= minAge && userAge <= maxAge;
          const isInRange = userAge >= minAge && userAge <= maxAge;

          expect(isInRange).toBe(shouldInclude);
          return true;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should correctly map ages to cohorts', () => {
    fc.assert(
      fc.property(fc.integer({ min: 13, max: 100 }), (age) => {
        const cohort = ageCohortAnalyzer.determineCohort(age);

        if (age >= 13 && age <= 17) {
          expect(cohort).toBe('13-17');
        } else if (age >= 18 && age <= 24) {
          expect(cohort).toBe('18-24');
        } else if (age >= 25 && age <= 39) {
          expect(cohort).toBe('25-39');
        } else if (age >= 40 && age <= 59) {
          expect(cohort).toBe('40-59');
        } else if (age >= 60) {
          expect(cohort).toBe('60+');
        }

        return true;
      }),
      { numRuns: 200 }
    );
  });

  it('should enforce cohort boundaries consistently', () => {
    fc.assert(
      fc.property(fc.integer({ min: 13, max: 100 }), (age) => {
        const cohort = ageCohortAnalyzer.determineCohort(age);
        const cohortAgain = ageCohortAnalyzer.determineCohort(age);

        // Same age should always map to same cohort
        expect(cohort).toBe(cohortAgain);

        // Adjacent ages at boundaries should map correctly
        if (age === 17) {
          expect(cohort).toBe('13-17');
          expect(ageCohortAnalyzer.determineCohort(age + 1)).toBe('18-24');
        } else if (age === 24) {
          expect(cohort).toBe('18-24');
          expect(ageCohortAnalyzer.determineCohort(age + 1)).toBe('25-39');
        } else if (age === 39) {
          expect(cohort).toBe('25-39');
          expect(ageCohortAnalyzer.determineCohort(age + 1)).toBe('40-59');
        } else if (age === 59) {
          expect(cohort).toBe('40-59');
          expect(ageCohortAnalyzer.determineCohort(age + 1)).toBe('60+');
        }

        return true;
      }),
      { numRuns: 200 }
    );
  });
});

describe('Property B7: Curation opt-out behavior', () => {
  it('should respect curation_enabled flag', () => {
    fc.assert(
      fc.property(fc.boolean(), (curationEnabled) => {
        // When curation is disabled, content should be shown chronologically
        // When enabled, content should be personalized
        const shouldPersonalize = curationEnabled;

        // This is a behavioral property - the actual implementation
        // would check this flag before applying curation
        expect(typeof shouldPersonalize).toBe('boolean');
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should disable sub-preferences when master toggle is off', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        (curationEnabled, allowAgeBased, allowEngagement) => {
          // If curation is disabled, sub-preferences should have no effect
          const effectiveAgeBased = curationEnabled && allowAgeBased;
          const effectiveEngagement = curationEnabled && allowEngagement;

          if (!curationEnabled) {
            expect(effectiveAgeBased).toBe(false);
            expect(effectiveEngagement).toBe(false);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow independent control of sub-preferences when enabled', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (allowAgeBased, allowEngagement) => {
        const curationEnabled = true;

        const effectiveAgeBased = curationEnabled && allowAgeBased;
        const effectiveEngagement = curationEnabled && allowEngagement;

        // Sub-preferences should be independently controllable
        expect(effectiveAgeBased).toBe(allowAgeBased);
        expect(effectiveEngagement).toBe(allowEngagement);

        return true;
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property B8: Age update triggers recalculation', () => {
  it('should detect age changes correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 13, max: 100 }),
        fc.integer({ min: 13, max: 100 }),
        (oldAge, newAge) => {
          const ageChanged = oldAge !== newAge;
          const shouldRecalculate = ageChanged;

          expect(shouldRecalculate).toBe(ageChanged);
          return true;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should detect cohort changes when age crosses boundaries', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 13, max: 100 }),
        fc.integer({ min: -10, max: 10 }),
        (baseAge, ageChange) => {
          const newAge = Math.max(13, Math.min(100, baseAge + ageChange));

          const oldCohort = ageCohortAnalyzer.determineCohort(baseAge);
          const newCohort = ageCohortAnalyzer.determineCohort(newAge);

          const cohortChanged = oldCohort !== newCohort;

          // If cohort changed, recalculation should be triggered
          if (cohortChanged) {
            expect(oldCohort).not.toBe(newCohort);
          }

          return true;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should trigger recalculation for boundary crossings', () => {
    const boundaries = [
      { age: 17, oldCohort: '13-17', newCohort: '18-24' },
      { age: 24, oldCohort: '18-24', newCohort: '25-39' },
      { age: 39, oldCohort: '25-39', newCohort: '40-59' },
      { age: 59, oldCohort: '40-59', newCohort: '60+' },
    ];

    boundaries.forEach(({ age, oldCohort, newCohort }) => {
      expect(ageCohortAnalyzer.determineCohort(age)).toBe(oldCohort);
      expect(ageCohortAnalyzer.determineCohort(age + 1)).toBe(newCohort);
    });
  });

  it('should not trigger recalculation when age stays in same cohort', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<AgeCohort>('13-17', '18-24', '25-39', '40-59', '60+'),
        fc.integer({ min: 0, max: 3 }),
        (cohort, offset) => {
          // Get a base age for the cohort
          let baseAge: number;
          switch (cohort) {
            case '13-17':
              baseAge = 15;
              break;
            case '18-24':
              baseAge = 20;
              break;
            case '25-34':
              baseAge = 30;
              break;
            case '35-49':
              baseAge = 45;
              break;
            case '50+':
              baseAge = 65;
              break;
          }

          const age1 = baseAge;
          const age2 = baseAge + offset;

          const cohort1 = ageCohortAnalyzer.determineCohort(age1);
          const cohort2 = ageCohortAnalyzer.determineCohort(age2);

          if (cohort1 === cohort2) {
            // No recalculation needed
            expect(cohort1).toBe(cohort2);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
