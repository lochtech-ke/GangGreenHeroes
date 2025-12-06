import * as fc from 'fast-check';

// Test data factories for generating consistent test data

/**
 * Factory for generating User objects
 */
export const userFactory = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  created_at: fc.date().map(d => d.toISOString()),
  updated_at: fc.date().map(d => d.toISOString()),
  email_confirmed_at: fc.option(fc.date().map(d => d.toISOString()), { nil: null }),
  phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: null }),
  confirmed_at: fc.option(fc.date().map(d => d.toISOString()), { nil: null }),
  last_sign_in_at: fc.option(fc.date().map(d => d.toISOString()), { nil: null }),
  app_metadata: fc.record({}),
  user_metadata: fc.record({}),
  role: fc.option(fc.string(), { nil: null }),
  aud: fc.constant('authenticated'),
  user_type: fc.constantFrom('individual', 'corporate', 'community', 'partner'),
});

/**
 * Factory for generating UserProfile objects
 */
export const userProfileFactory = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  display_name: fc.string({ minLength: 2, maxLength: 50 }),
  avatar: fc.option(fc.webUrl(), { nil: null }),
  bio: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
  location: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  age: fc.option(fc.integer({ min: 13, max: 100 }), { nil: null }),
  age_cohort: fc.option(
    fc.constantFrom('13-17', '18-24', '25-34', '35-49', '50+'),
    { nil: null }
  ),
  climate_interests: fc.array(
    fc.constantFrom('trees', 'water', 'waste', 'policy'),
    { minLength: 0, maxLength: 4 }
  ),
  user_type: fc.constantFrom('individual', 'corporate', 'community', 'partner'),
  journey_stage: fc.constantFrom('onboarding', 'engagement', 'contribution', 'recognition', 'hero'),
  badge_tier: fc.constantFrom('steward', 'platinum', 'hero'),
  green_coins: fc.integer({ min: 0, max: 10000 }),
  trees_planted: fc.integer({ min: 0, max: 1000 }),
  curation_enabled: fc.boolean(),
  is_ambassador: fc.boolean(),
  referral_code: fc.string({ minLength: 6, maxLength: 20 }),
  created_at: fc.date().map(d => d.toISOString()),
  updated_at: fc.date().map(d => d.toISOString()),
});

/**
 * Factory for generating Community objects
 */
export const communityFactory = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 3, maxLength: 100 }),
  description: fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
  county: fc.option(fc.string({ maxLength: 50 }), { nil: null }),
  sub_county: fc.option(fc.string({ maxLength: 50 }), { nil: null }),
  member_count: fc.integer({ min: 0, max: 10000 }),
  activity_level: fc.constantFrom('low', 'medium', 'high'),
  avatar: fc.option(fc.webUrl(), { nil: null }),
  cover_image: fc.option(fc.webUrl(), { nil: null }),
  created_at: fc.date().map(d => d.toISOString()),
});

/**
 * Factory for generating Mission objects
 */
export const missionFactory = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 5, maxLength: 200 }),
  description: fc.string({ minLength: 10, maxLength: 2000 }),
  mission_type: fc.constantFrom('tree_planting', 'waste_cleanup', 'water_conservation', 'petition', 'fundraising'),
  organizer_id: fc.uuid(),
  location_name: fc.string({ minLength: 3, maxLength: 200 }),
  location_coordinates: fc.tuple(
    fc.float({ min: -90, max: 90 }), // latitude
    fc.float({ min: -180, max: 180 }) // longitude
  ),
  start_date: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString()),
  end_date: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString()),
  target_metric: fc.string({ maxLength: 50 }),
  target_value: fc.float({ min: 1, max: 10000 }),
  current_value: fc.float({ min: 0, max: 10000 }),
  participant_count: fc.integer({ min: 0, max: 1000 }),
  green_coin_reward: fc.integer({ min: 1, max: 1000 }),
  verification_required: fc.boolean(),
  status: fc.constantFrom('upcoming', 'active', 'completed', 'cancelled'),
  created_at: fc.date().map(d => d.toISOString()),
});

/**
 * Factory for generating Learning Module objects
 */
export const learningModuleFactory = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 5, maxLength: 200 }),
  description: fc.string({ minLength: 10, maxLength: 1000 }),
  category: fc.constantFrom('conservation', 'waste', 'water', 'climate_justice', 'policy'),
  difficulty: fc.constantFrom('beginner', 'intermediate', 'advanced'),
  duration: fc.integer({ min: 5, max: 120 }), // minutes
  green_coin_reward: fc.integer({ min: 5, max: 100 }),
  badge_reward: fc.option(fc.string(), { nil: null }),
  created_at: fc.date().map(d => d.toISOString()),
});

/**
 * Factory for generating Content Curation objects
 */
export const contentItemFactory = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('initiative', 'social_post', 'challenge', 'educational', 'mission'),
  title: fc.string({ minLength: 5, maxLength: 200 }),
  description: fc.string({ minLength: 10, maxLength: 1000 }),
  relevance_score: fc.float({ min: 0, max: 100 }),
  age_targeting: fc.option(
    fc.array(fc.constantFrom('13-17', '18-24', '25-34', '35-49', '50+'), { minLength: 1, maxLength: 5 }),
    { nil: null }
  ),
  metadata: fc.record({
    author_id: fc.option(fc.uuid(), { nil: null }),
    created_at: fc.date().map(d => d.toISOString()),
    engagement_count: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: null }),
  }),
});

/**
 * Factory for generating Error objects
 */
export const errorFactory = fc.record({
  name: fc.string({ minLength: 3, maxLength: 50 }),
  message: fc.string({ minLength: 5, maxLength: 200 }),
  code: fc.option(fc.string({ minLength: 3, maxLength: 20 }), { nil: null }),
  severity: fc.constantFrom('low', 'medium', 'high', 'critical'),
  context: fc.option(
    fc.record({
      component: fc.option(fc.string(), { nil: null }),
      action: fc.option(fc.string(), { nil: null }),
      userId: fc.option(fc.uuid(), { nil: null }),
      route: fc.option(fc.string(), { nil: null }),
      timestamp: fc.date().map(d => d.toISOString()),
    }),
    { nil: null }
  ),
});

/**
 * Factory for generating GG Coin Transaction objects
 */
export const ggCoinTransactionFactory = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  transaction_type: fc.constantFrom('earn', 'spend', 'bonus', 'referral'),
  amount: fc.integer({ min: 1, max: 1000 }),
  source: fc.string({ minLength: 3, maxLength: 100 }),
  description: fc.string({ minLength: 5, maxLength: 200 }),
  timestamp: fc.date().map(d => d.toISOString()),
});

// Deprecated: Use ggCoinTransactionFactory instead
export const greenCoinTransactionFactory = ggCoinTransactionFactory;

/**
 * Factory for generating Planted Tree objects
 */
export const plantedTreeFactory = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  species: fc.string({ minLength: 3, maxLength: 100 }),
  planted_date: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString().split('T')[0]),
  location_name: fc.string({ minLength: 3, maxLength: 200 }),
  location_coordinates: fc.tuple(
    fc.float({ min: -90, max: 90 }), // latitude
    fc.float({ min: -180, max: 180 }) // longitude
  ),
  health_status: fc.constantFrom('healthy', 'needs_attention', 'deceased'),
  height_cm: fc.option(fc.float({ min: 10, max: 5000 }), { nil: null }),
  diameter_cm: fc.option(fc.float({ min: 1, max: 200 }), { nil: null }),
  last_measured: fc.option(fc.date().map(d => d.toISOString()), { nil: null }),
  estimated_co2_kg_per_year: fc.option(fc.float({ min: 1, max: 100 }), { nil: null }),
  created_at: fc.date().map(d => d.toISOString()),
});

/**
 * Arbitraries for age cohorts
 */
export const ageCohortArbitrary = fc.constantFrom('13-17', '18-24', '25-34', '35-49', '50+');

/**
 * Arbitraries for content types
 */
export const contentTypeArbitrary = fc.constantFrom('initiative', 'social_post', 'challenge', 'educational', 'mission');

/**
 * Arbitraries for user types
 */
export const userTypeArbitrary = fc.constantFrom('individual', 'corporate', 'community', 'partner');

/**
 * Helper function to create a user with specific age cohort
 */
export function userWithAgeCohort(cohort: string) {
  const ageRanges = {
    '13-17': { min: 13, max: 17 },
    '18-24': { min: 18, max: 24 },
    '25-34': { min: 25, max: 34 },
    '35-49': { min: 35, max: 49 },
    '50+': { min: 50, max: 100 },
  };

  const range = ageRanges[cohort as keyof typeof ageRanges] || { min: 18, max: 65 };

  return userProfileFactory.map(user => ({
    ...user,
    age: fc.sample(fc.integer({ min: range.min, max: range.max }), 1)[0],
    age_cohort: cohort,
  }));
}

/**
 * Helper function to create content with specific age targeting
 */
export function contentWithAgeTargeting(targetCohorts: string[]) {
  return contentItemFactory.map(content => ({
    ...content,
    age_targeting: targetCohorts,
  }));
}