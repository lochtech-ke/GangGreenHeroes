# Design Document: Age-Based Content Curation Engine

## Overview

The Age-Based Content Curation Engine is an AI-powered personalization system that tailors the GangGreen platform dashboard experience to users based on their age demographics. The system analyzes user age cohorts (13-17, 18-24, 25-34, 35-49, 50+) and applies intelligent filtering, scoring, and ranking algorithms to surface the most relevant conservation initiatives, challenges, educational content, and community activities.

The engine operates as a middleware layer between content sources (initiatives, social posts, challenges) and the dashboard presentation layer. It combines rule-based filtering with engagement-driven machine learning to continuously improve relevance predictions. The system respects user privacy, provides opt-out controls, and gracefully handles edge cases like missing age data or system failures.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Dashboard Layer                          │
│  (React Components consuming curated content)                │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Content Curation Engine                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Scoring    │  │   Filtering  │  │   Ranking    │      │
│  │   Engine     │  │   Engine     │  │   Engine     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Age Cohort  │  │  Engagement  │  │   Fallback   │      │
│  │   Analyzer   │  │   Tracker    │  │   Handler    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Content Sources                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Initiatives  │  │ Social Posts │  │  Challenges  │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Supabase Database                           │
│  - user_profiles (age, preferences)                          │
│  - content_items (initiatives, posts, challenges)            │
│  - content_interactions (clicks, saves, joins)               │
│  - curation_rules (age cohort configurations)                │
│  - relevance_scores (cached scoring results)                 │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Request**: Dashboard requests curated content for authenticated user
2. **Age Analysis**: System retrieves user age and determines cohort
3. **Content Retrieval**: Fetch all available content items from sources
4. **Filtering**: Apply age-appropriate filters (remove restricted content)
5. **Scoring**: Calculate relevance scores based on cohort preferences + personal history
6. **Ranking**: Sort content by relevance score (descending)
7. **Response**: Return top N items to dashboard
8. **Tracking**: Log user interactions for future personalization

### Integration Points

- **AuthContext**: Provides current user data including age
- **Dashboard Service**: Extended with curation methods
- **Initiative Service**: Tagged with age targeting metadata
- **Social Feed Service**: Filtered by age-appropriate content
- **User Profile**: Stores age, curation preferences, opt-out settings

## Components and Interfaces

### 1. Content Curation Service

**File**: `src/services/contentCuration.service.ts`

```typescript
interface CurationRequest {
  userId: string;
  contentTypes: ContentType[];
  limit: number;
  offset?: number;
}

interface CurationResponse {
  items: CuratedContentItem[];
  hasMore: boolean;
  total: number;
}

interface CuratedContentItem {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  relevanceScore: number;
  ageTargeting?: AgeRange[];
  metadata: Record<string, any>;
}

type ContentType = 'initiative' | 'social_post' | 'challenge' | 'educational';
type AgeCohort = '13-17' | '18-24' | '25-34' | '35-49' | '50+';

interface AgeRange {
  min: number;
  max: number;
}

class ContentCurationService {
  async getCuratedContent(request: CurationRequest): Promise<CurationResponse>;
  async calculateRelevanceScore(item: ContentItem, user: UserProfile): Promise<number>;
  async applyAgeFilters(items: ContentItem[], cohort: AgeCohort): Promise<ContentItem[]>;
  async trackInteraction(userId: string, itemId: string, interactionType: string): Promise<void>;
}
```

### 2. Age Cohort Analyzer

**File**: `src/services/ageCohortAnalyzer.service.ts`

```typescript
interface UserAgeCohort {
  cohort: AgeCohort;
  age: number;
  preferences: CohortPreferences;
}

interface CohortPreferences {
  contentTypes: Record<ContentType, number>; // Weight 0-1
  engagementPatterns: EngagementPattern[];
  filterRules: FilterRule[];
}

interface EngagementPattern {
  contentType: ContentType;
  avgTimeSpent: number;
  interactionRate: number;
}

interface FilterRule {
  field: string;
  operator: 'eq' | 'gt' | 'lt' | 'contains' | 'excludes';
  value: any;
}

class AgeCohortAnalyzer {
  determineCohort(age: number): AgeCohort;
  getCohortPreferences(cohort: AgeCohort): Promise<CohortPreferences>;
  updateCohortPreferences(cohort: AgeCohort, engagementData: EngagementData[]): Promise<void>;
}
```

### 3. Scoring Engine

**File**: `src/services/scoringEngine.service.ts`

```typescript
interface ScoringContext {
  user: UserProfile;
  cohort: AgeCohort;
  personalHistory: InteractionHistory;
  cohortPreferences: CohortPreferences;
}

interface InteractionHistory {
  totalInteractions: number;
  contentTypeBreakdown: Record<ContentType, number>;
  recentInteractions: Interaction[];
}

interface Interaction {
  itemId: string;
  itemType: ContentType;
  interactionType: 'view' | 'click' | 'save' | 'join' | 'share';
  timestamp: string;
}

class ScoringEngine {
  calculateScore(item: ContentItem, context: ScoringContext): number;
  getWeightingStrategy(interactionCount: number): { cohortWeight: number; personalWeight: number };
  applyBoosts(baseScore: number, item: ContentItem, context: ScoringContext): number;
}
```

### 4. Curation Rules Manager

**File**: `src/services/curationRules.service.ts`

```typescript
interface CurationRule {
  id: string;
  cohort: AgeCohort;
  ruleType: 'filter' | 'boost' | 'penalty';
  condition: RuleCondition;
  action: RuleAction;
  priority: number;
  isActive: boolean;
}

interface RuleCondition {
  field: string;
  operator: string;
  value: any;
}

interface RuleAction {
  type: 'exclude' | 'include' | 'score_multiply' | 'score_add';
  value: number;
}

class CurationRulesService {
  async getRulesForCohort(cohort: AgeCohort): Promise<CurationRule[]>;
  async createRule(rule: Omit<CurationRule, 'id'>): Promise<CurationRule>;
  async updateRule(ruleId: string, updates: Partial<CurationRule>): Promise<CurationRule>;
  async deleteRule(ruleId: string): Promise<void>;
  async testRule(rule: CurationRule, testData: ContentItem[]): Promise<TestResult>;
}
```

### 5. Engagement Tracker

**File**: `src/services/engagementTracker.service.ts`

```typescript
interface EngagementEvent {
  userId: string;
  itemId: string;
  itemType: ContentType;
  eventType: 'impression' | 'click' | 'save' | 'join' | 'share' | 'complete';
  timestamp: string;
  metadata?: Record<string, any>;
}

interface EngagementMetrics {
  cohort: AgeCohort;
  contentType: ContentType;
  impressions: number;
  clicks: number;
  clickThroughRate: number;
  avgEngagementTime: number;
  conversionRate: number;
}

class EngagementTracker {
  async trackEvent(event: EngagementEvent): Promise<void>;
  async getMetrics(cohort: AgeCohort, dateRange: DateRange): Promise<EngagementMetrics[]>;
  async getUserHistory(userId: string, limit: number): Promise<Interaction[]>;
  async getCohortEngagementPatterns(cohort: AgeCohort): Promise<EngagementPattern[]>;
}
```

### 6. Fallback Handler

**File**: `src/services/curationFallback.service.ts`

```typescript
interface FallbackStrategy {
  name: string;
  condition: (error: Error) => boolean;
  handler: (request: CurationRequest) => Promise<CurationResponse>;
}

class CurationFallbackService {
  async handleMissingAge(userId: string): Promise<CurationResponse>;
  async handleEngineFailure(request: CurationRequest): Promise<CurationResponse>;
  async handleInsufficientContent(cohort: AgeCohort, available: ContentItem[]): Promise<ContentItem[]>;
  async getChronologicalFeed(request: CurationRequest): Promise<CurationResponse>;
}
```

## Data Models

### Database Schema Extensions

```sql
-- User age and curation preferences
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS age_curation_enabled BOOLEAN DEFAULT true;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS age_cohort VARCHAR(10);

-- Content age targeting
CREATE TABLE IF NOT EXISTS content_age_targeting (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  min_age INTEGER,
  max_age INTEGER,
  target_cohorts TEXT[], -- Array of cohort strings
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Curation rules
CREATE TABLE IF NOT EXISTS curation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort VARCHAR(10) NOT NULL,
  rule_type VARCHAR(20) NOT NULL, -- 'filter', 'boost', 'penalty'
  condition JSONB NOT NULL,
  action JSONB NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Content interactions for engagement tracking
CREATE TABLE IF NOT EXISTS content_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  interaction_type VARCHAR(20) NOT NULL, -- 'view', 'click', 'save', 'join', 'share'
  age_cohort VARCHAR(10),
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_interactions_user ON content_interactions(user_id, timestamp DESC);
CREATE INDEX idx_interactions_content ON content_interactions(content_id, content_type);
CREATE INDEX idx_interactions_cohort ON content_interactions(age_cohort, timestamp DESC);

-- Relevance score cache
CREATE TABLE IF NOT EXISTS relevance_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  calculated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  UNIQUE(user_id, content_id, content_type)
);

CREATE INDEX idx_relevance_user_score ON relevance_scores(user_id, score DESC);

-- Cohort engagement metrics (aggregated)
CREATE TABLE IF NOT EXISTS cohort_engagement_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort VARCHAR(10) NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  joins INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  avg_engagement_seconds INTEGER DEFAULT 0,
  UNIQUE(cohort, content_type, date)
);

CREATE INDEX idx_cohort_metrics ON cohort_engagement_metrics(cohort, date DESC);
```

### TypeScript Type Definitions

**File**: `src/types/contentCuration.types.ts`

```typescript
export type AgeCohort = '13-17' | '18-24' | '25-34' | '35-49' | '50+' | 'unknown';
export type ContentType = 'initiative' | 'social_post' | 'challenge' | 'educational' | 'event';
export type InteractionType = 'impression' | 'view' | 'click' | 'save' | 'join' | 'share' | 'complete';

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  createdAt: string;
  ageTargeting?: AgeTargeting;
  metadata: Record<string, any>;
}

export interface AgeTargeting {
  minAge?: number;
  maxAge?: number;
  targetCohorts?: AgeCohort[];
  excludeCohorts?: AgeCohort[];
}

export interface UserCurationProfile {
  userId: string;
  age?: number;
  dateOfBirth?: string;
  cohort: AgeCohort;
  curationEnabled: boolean;
  interactionCount: number;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  contentTypeWeights: Record<ContentType, number>;
  forestPreference?: string;
  topicInterests?: string[];
}

export interface RelevanceScore {
  itemId: string;
  score: number;
  breakdown: {
    cohortScore: number;
    personalScore: number;
    boosts: number;
    penalties: number;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

Before defining the final correctness properties, I've reviewed all testable properties from the prework to eliminate redundancy:

**Redundancies Identified:**
- Properties 8.1, 8.2, and 8.3 can be combined into a single comprehensive property about weighting strategies based on interaction count
- Property 8.4 is redundant as it's a general statement covered by the specific weighting properties
- Properties about content type prioritization (1.1, 2.1, 3.1) follow the same pattern and can use a unified testing approach
- Properties about inclusion rules (2.3, 3.3) can be combined into a general inclusion property

**Consolidated Approach:**
- Combine weighting properties into one parameterized property
- Create a general content prioritization property that works across all cohorts
- Merge similar filtering and inclusion rules where the logic is identical

### Correctness Properties

Property 1: Age-appropriate content filtering
*For any* user in a specific age cohort and any content item with age restrictions, if the content's minimum age exceeds the user's cohort maximum age OR the content's maximum age is below the user's cohort minimum age, then that content should not appear in the curated results
**Validates: Requirements 1.3, 1.5**

Property 2: Content type prioritization by cohort
*For any* age cohort and its associated preferred content types, when curating content for a user in that cohort, the proportion of preferred content types in the top N results should be significantly higher than their proportion in the overall content pool
**Validates: Requirements 1.1, 2.1, 3.1**

Property 3: Interactive format prioritization for youth
*For any* user aged 13-24 and any educational content items, the curated results should rank interactive and short-form educational content higher than traditional long-form content
**Validates: Requirements 1.4**

Property 4: Financial content inclusion for professionals
*For any* user aged 25-49, the curated content should include carbon credit investment opportunities and donation-based initiatives (i.e., these content types should not be filtered out)
**Validates: Requirements 2.3**

Property 5: Mentorship content for low-engagement professionals
*For any* user aged 25-49 with fewer than 10 interactions, the curated content should include mentorship and leadership role opportunities
**Validates: Requirements 2.5**

Property 6: Long-term impact content for seniors
*For any* user aged 50+, the curated content should include educational content about long-term environmental impact and legacy projects
**Validates: Requirements 3.1, 3.3**

Property 7: Rule validation on update
*For any* curation rule modification by an administrator, the system should validate the rule structure and reject invalid rules before applying them
**Validates: Requirements 4.2**

Property 8: Performance-based alerting
*For any* content item, if its engagement rate varies by more than 50% between any two age cohorts over a 7-day period, the system should generate an alert for administrator review
**Validates: Requirements 4.4**

Property 9: Preview mode accuracy
*For any* curation rule and test age profile, the preview mode results should match the actual curation results that would be generated for a real user with that age profile
**Validates: Requirements 4.5**

Property 10: Curation opt-out behavior
*For any* user who disables age-based curation, the content feed should switch to a chronological or general algorithm that does not consider age cohort in scoring
**Validates: Requirements 5.3**

Property 11: Age update triggers recalculation
*For any* user who updates their age information, the relevance scores for all content items should be recalculated, and the new scores should differ from the previous scores if the age cohort changed
**Validates: Requirements 5.4**

Property 12: Reach estimation accuracy
*For any* content item with age targeting specified, the estimated reach calculation should accurately reflect the number of users in the targeted cohorts
**Validates: Requirements 6.2**

Property 13: Age targeting enforcement
*For any* content item with specific age cohort targeting, that content should only appear in curated results for users within the targeted cohorts
**Validates: Requirements 6.3**

Property 14: Default all-ages visibility
*For any* content item without age targeting specified, that content should be eligible to appear in curated results for users of all age cohorts with neutral baseline scoring
**Validates: Requirements 6.5**

Property 15: Interaction logging with cohort metadata
*For any* user interaction with content, the logged interaction record should include the user's age cohort at the time of interaction
**Validates: Requirements 7.1**

Property 16: Cohort engagement influences scoring
*For any* content item, if it has high engagement rates within a specific age cohort, its relevance score for users in that cohort should be higher than for users in cohorts with low engagement rates
**Validates: Requirements 7.2**

Property 17: Low engagement reduces relevance
*For any* content item that receives engagement rates below the cohort average for 7 consecutive days, its relevance score for that cohort should decrease
**Validates: Requirements 7.4**

Property 18: Adaptive weighting by interaction count
*For any* user, the weighting between cohort-based scoring and personal history should follow this pattern: <10 interactions = 80% cohort/20% personal, 10-50 interactions = 50%/50%, >50 interactions = 30% cohort/70% personal
**Validates: Requirements 8.1, 8.2, 8.3**

Property 19: Divergent behavior prioritization
*For any* user whose content interaction patterns differ significantly (>40% deviation) from their age cohort's average patterns, the personal history weight should increase beyond the standard formula
**Validates: Requirements 8.5**

Property 20: Missing age fallback
*For any* user without age information, the curation system should return a general content feed and include prompts to complete their profile
**Validates: Requirements 9.1**

Property 21: Invalid age handling
*For any* age value that is negative, zero, or exceeds 120, the system should reject it as invalid and request verification while using general curation
**Validates: Requirements 9.2**

Property 22: Engine failure fallback
*For any* curation request, if the scoring engine throws an error, the system should fall back to chronological content ordering without failing the entire request
**Validates: Requirements 9.3**

Property 23: Insufficient content supplementation
*For any* age cohort, if the available content matching that cohort's preferences is fewer than the requested limit, the system should supplement with content from adjacent cohorts marked as "also recommended"
**Validates: Requirements 9.5**

## Error Handling

### Error Categories

1. **User Data Errors**
   - Missing age information
   - Invalid age values (negative, zero, >120)
   - Corrupted user profile data
   - **Handling**: Fall back to general curation, prompt for profile completion

2. **Content Data Errors**
   - Missing content metadata
   - Invalid age targeting configuration
   - Corrupted content records
   - **Handling**: Skip invalid items, log errors, continue with valid content

3. **Scoring Engine Errors**
   - Calculation failures
   - Timeout during score computation
   - Invalid scoring parameters
   - **Handling**: Use cached scores if available, fall back to chronological ordering

4. **Database Errors**
   - Connection failures
   - Query timeouts
   - Transaction conflicts
   - **Handling**: Retry with exponential backoff, use cached data, return partial results

5. **Rule Validation Errors**
   - Invalid rule syntax
   - Conflicting rules
   - Circular dependencies
   - **Handling**: Reject rule updates, maintain previous valid rules, notify administrator

### Error Recovery Strategies

```typescript
interface ErrorRecoveryStrategy {
  errorType: string;
  maxRetries: number;
  fallbackBehavior: 'cache' | 'chronological' | 'general' | 'partial';
  userNotification: boolean;
}

const recoveryStrategies: ErrorRecoveryStrategy[] = [
  {
    errorType: 'SCORING_TIMEOUT',
    maxRetries: 2,
    fallbackBehavior: 'cache',
    userNotification: false
  },
  {
    errorType: 'DATABASE_CONNECTION',
    maxRetries: 3,
    fallbackBehavior: 'cache',
    userNotification: true
  },
  {
    errorType: 'MISSING_AGE',
    maxRetries: 0,
    fallbackBehavior: 'general',
    userNotification: true
  },
  {
    errorType: 'ENGINE_FAILURE',
    maxRetries: 1,
    fallbackBehavior: 'chronological',
    userNotification: false
  }
];
```

### Graceful Degradation

The system implements graceful degradation to ensure users always receive content:

1. **Primary**: Full age-based curation with personalization
2. **Degraded**: Age-based curation without personalization (cohort only)
3. **Minimal**: General curation without age consideration
4. **Fallback**: Chronological feed of all content

## Testing Strategy

### Unit Testing

Unit tests will verify individual components in isolation:

**Scoring Engine Tests:**
- Test score calculation with various user profiles
- Test weighting strategy selection based on interaction count
- Test boost and penalty application
- Test edge cases (zero interactions, missing data)

**Age Cohort Analyzer Tests:**
- Test cohort determination for boundary ages (17, 18, 24, 25, etc.)
- Test cohort preference retrieval
- Test preference updates based on engagement data

**Filtering Engine Tests:**
- Test age restriction filtering
- Test content type filtering
- Test rule application order
- Test filter combination logic

**Fallback Handler Tests:**
- Test missing age handling
- Test invalid age handling
- Test engine failure recovery
- Test insufficient content supplementation

### Property-Based Testing

Property-based tests will verify universal properties across many randomly generated inputs using **fast-check** (JavaScript/TypeScript property testing library). Each test will run a minimum of 100 iterations.

**Test Configuration:**
```typescript
import fc from 'fast-check';

// Configure property tests to run 100+ iterations
const propertyTestConfig = {
  numRuns: 100,
  verbose: true
};
```

**Property Test Structure:**
Each property-based test will:
1. Generate random users with various ages and interaction histories
2. Generate random content items with various age targeting configurations
3. Execute the curation engine
4. Verify the correctness property holds for all generated inputs
5. Report any counterexamples that violate the property

**Generator Strategies:**
- **User Generator**: Creates users with ages 13-100, varying interaction counts (0-200), and different cohorts
- **Content Generator**: Creates content with random types, age restrictions, and metadata
- **Interaction Generator**: Creates realistic interaction histories with temporal patterns
- **Rule Generator**: Creates valid curation rules with various conditions and actions

### Integration Testing

Integration tests will verify component interactions:

- Test end-to-end curation flow from request to response
- Test database interactions for storing/retrieving engagement data
- Test caching layer integration
- Test real-time rule updates and their effect on curation
- Test analytics aggregation across cohorts

### Performance Testing

Performance tests will ensure the system meets latency requirements:

- Curation request should complete in <500ms for 50 items
- Score calculation should complete in <50ms per item
- Rule validation should complete in <100ms
- Fallback to chronological should complete in <200ms

### Acceptance Testing

Acceptance tests will verify requirements are met:

- Test each user story scenario with realistic data
- Verify UI displays curated content correctly
- Test administrator workflows for rule management
- Verify privacy controls work as expected
- Test opt-out functionality

## Performance Considerations

### Caching Strategy

**Relevance Score Caching:**
- Cache scores for 15 minutes per user-content pair
- Invalidate cache on user age update or rule changes
- Use Redis for distributed caching in production

**Cohort Preference Caching:**
- Cache cohort preferences for 1 hour
- Update cache when engagement patterns change significantly
- Store in application memory for fast access

**Content Metadata Caching:**
- Cache content age targeting for 5 minutes
- Invalidate on content updates
- Use CDN edge caching for static metadata

### Database Optimization

**Indexing Strategy:**
```sql
-- Optimize user age lookups
CREATE INDEX idx_user_age_cohort ON user_profiles(age_cohort, age);

-- Optimize content targeting lookups
CREATE INDEX idx_content_targeting ON content_age_targeting(content_type, target_cohorts);

-- Optimize interaction queries
CREATE INDEX idx_interactions_cohort_time ON content_interactions(age_cohort, timestamp DESC);

-- Optimize relevance score lookups
CREATE INDEX idx_relevance_user_score ON relevance_scores(user_id, score DESC, expires_at);
```

**Query Optimization:**
- Use materialized views for cohort engagement metrics
- Batch score calculations for multiple items
- Use connection pooling for database access
- Implement read replicas for analytics queries

### Scalability

**Horizontal Scaling:**
- Stateless curation service can scale horizontally
- Use message queue for async engagement tracking
- Distribute score calculations across workers
- Implement rate limiting per user

**Vertical Optimization:**
- Optimize scoring algorithm for O(n log n) complexity
- Use parallel processing for independent score calculations
- Minimize database round trips with batch queries
- Implement lazy loading for content metadata

## Security and Privacy

### Data Protection

**Age Data Encryption:**
- Encrypt age and date of birth at rest using AES-256
- Use column-level encryption in database
- Restrict access to age data to curation service only
- Audit all age data access

**Access Control:**
- Implement role-based access control (RBAC) for admin features
- Require authentication for all curation requests
- Use JWT tokens with short expiration for API access
- Log all rule modifications with administrator identity

### Privacy Controls

**User Consent:**
- Request explicit consent for age-based personalization during registration
- Provide clear explanation of how age data is used
- Allow users to view what data is collected
- Implement right to deletion for age data

**Opt-Out Mechanism:**
- Provide easy-to-find toggle in privacy settings
- Immediately disable age-based curation when opted out
- Delete cached relevance scores on opt-out
- Maintain opt-out preference across sessions

**Data Minimization:**
- Only collect age, not full date of birth (unless required)
- Aggregate engagement data at cohort level for analytics
- Anonymize interaction logs after 90 days
- Delete relevance score cache after 30 days of inactivity

## Deployment Strategy

### Phased Rollout

**Phase 1: Internal Testing (Week 1-2)**
- Deploy to staging environment
- Test with synthetic user data
- Validate all correctness properties
- Performance testing with load simulation

**Phase 2: Beta Testing (Week 3-4)**
- Enable for 10% of users (A/B test)
- Monitor engagement metrics
- Collect user feedback
- Fix critical bugs

**Phase 3: Gradual Rollout (Week 5-6)**
- Increase to 50% of users
- Monitor system performance
- Adjust curation rules based on data
- Optimize scoring algorithms

**Phase 4: Full Deployment (Week 7)**
- Enable for 100% of users
- Continue monitoring
- Iterate on improvements
- Document lessons learned

### Monitoring and Observability

**Key Metrics:**
- Curation request latency (p50, p95, p99)
- Relevance score calculation time
- Cache hit rate
- Fallback activation rate
- User engagement rate by cohort
- Content diversity in results

**Alerting:**
- Alert on curation latency >1s
- Alert on fallback rate >5%
- Alert on cache hit rate <80%
- Alert on engagement drop >20% for any cohort
- Alert on error rate >1%

**Logging:**
- Log all curation requests with user cohort
- Log all rule modifications
- Log all fallback activations
- Log all property test failures
- Aggregate logs for analytics

### Rollback Plan

**Rollback Triggers:**
- Curation latency exceeds 2s for >5 minutes
- Error rate exceeds 5%
- User engagement drops >30% compared to baseline
- Critical bug discovered in production

**Rollback Procedure:**
1. Disable age-based curation feature flag
2. Fall back to general chronological feed
3. Investigate root cause
4. Fix issue in staging
5. Re-test thoroughly
6. Re-deploy with fixes

## Future Enhancements

### Machine Learning Integration

**Collaborative Filtering:**
- Implement user-user collaborative filtering within cohorts
- Use matrix factorization for preference prediction
- Train models on cohort engagement patterns

**Content Embeddings:**
- Generate content embeddings using NLP
- Cluster similar content for better recommendations
- Use embeddings for semantic similarity scoring

**Reinforcement Learning:**
- Implement multi-armed bandit for content exploration
- Use contextual bandits for personalized ranking
- Optimize for long-term engagement, not just clicks

### Advanced Personalization

**Multi-Dimensional Profiling:**
- Consider location, interests, and skills in addition to age
- Build comprehensive user profiles
- Use ensemble methods for scoring

**Temporal Patterns:**
- Learn time-of-day preferences by cohort
- Adjust curation based on day of week
- Detect seasonal engagement patterns

**Social Signals:**
- Incorporate friend activity into curation
- Use social proof for content boosting
- Enable collaborative filtering across social connections

### Cross-Platform Integration

**Mobile Optimization:**
- Optimize curation for mobile screen sizes
- Reduce payload size for mobile networks
- Implement progressive loading

**Email Digests:**
- Generate personalized email digests by cohort
- Use curation engine for email content selection
- A/B test email content strategies

**Push Notifications:**
- Use curation engine to select notification content
- Personalize notification timing by cohort
- Optimize for engagement without annoyance
