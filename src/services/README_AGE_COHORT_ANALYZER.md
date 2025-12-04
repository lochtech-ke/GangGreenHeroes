# Age Cohort Analyzer Service

## Overview

The Age Cohort Analyzer Service is a core component of the V1.0 content curation system. It analyzes user age data to determine cohort membership and provides cohort-specific preferences for personalizing content delivery.

## Features

- **Cohort Classification**: Automatically classifies users into age cohorts (13-17, 18-24, 25-34, 35-49, 50+)
- **Default Preferences**: Provides research-based default preferences for each cohort
- **Adaptive Learning**: Updates cohort preferences based on engagement data (Requirements B7.2, B7.3)
- **Database Integration**: Stores and retrieves custom preferences from Supabase
- **Validation**: Enforces age restrictions and validates input data

## Age Cohorts

### 13-17 (Youth - Minors)
**Focus**: Social engagement, gamification, peer challenges
- **Top Content Types**: Challenges (0.95), Social Posts (0.9), Educational (0.8)
- **Key Patterns**: Social media campaigns, peer challenges, gamified activities
- **Restrictions**: Excludes adult-only content and financial transactions

### 18-24 (Youth - Young Adults)
**Focus**: Digital participation, community engagement, social activism
- **Top Content Types**: Challenges (0.9), Social Posts (0.85), Missions (0.8)
- **Key Patterns**: Social campaigns, digital participation, community engagement
- **Restrictions**: Penalizes high financial requirements

### 25-34 (Professionals - Early Career)
**Focus**: Donations, skilled volunteering, corporate partnerships
- **Top Content Types**: Initiatives (0.9), Missions (0.85), Petitions (0.8)
- **Key Patterns**: Donation opportunities, skilled volunteering, carbon credits
- **Boosts**: Professional skill matches, donation-enabled content

### 35-49 (Professionals - Mid Career)
**Focus**: Leadership, mentorship, major contributions
- **Top Content Types**: Initiatives (0.95), Petitions (0.85), Missions (0.85)
- **Key Patterns**: Leadership roles, mentorship, corporate partnerships
- **Boosts**: Leadership opportunities, professional skills, donations

### 50+ (Seniors)
**Focus**: Legacy projects, advisory roles, knowledge sharing
- **Top Content Types**: Initiatives (0.95), Petitions (0.9), Educational (0.85)
- **Key Patterns**: Legacy projects, advisory roles, knowledge sharing
- **Boosts**: Low physical intensity, remote participation, long-term impact

## API Reference

### `determineCohort(age: number): AgeCohort`

Determines the age cohort for a given age.

```typescript
const cohort = ageCohortAnalyzer.determineCohort(25);
// Returns: '25-34'
```

**Parameters:**
- `age` (number): User's age in years

**Returns:** AgeCohort ('13-17' | '18-24' | '25-34' | '35-49' | '50+')

**Throws:** Error if age is < 13 or > 120

### `getCohortPreferences(cohort: AgeCohort): Promise<CohortPreferences>`

Gets preferences for a specific cohort, including custom rules from database.

```typescript
const preferences = await ageCohortAnalyzer.getCohortPreferences('25-34');
```

**Parameters:**
- `cohort` (AgeCohort): Target age cohort

**Returns:** Promise<CohortPreferences> with content type weights, engagement patterns, and filter rules

### `getDefaultPreferences(cohort: AgeCohort): CohortPreferences`

Gets default preferences for a cohort (synchronous, no database call).

```typescript
const defaults = ageCohortAnalyzer.getDefaultPreferences('18-24');
```

**Parameters:**
- `cohort` (AgeCohort): Target age cohort

**Returns:** CohortPreferences with default values

### `analyzeUser(age: number): Promise<UserAgeCohort>`

Performs complete cohort analysis for a user.

```typescript
const analysis = await ageCohortAnalyzer.analyzeUser(30);
// Returns: { cohort: '25-34', age: 30, preferences: {...}, lastUpdated: Date }
```

**Parameters:**
- `age` (number): User's age

**Returns:** Promise<UserAgeCohort> with cohort, age, preferences, and timestamp

### `updateCohortPreferences(cohort: AgeCohort, engagementData: EngagementData[]): Promise<CohortPreferences>`

Updates cohort preferences based on engagement metrics (adaptive learning).

```typescript
const updated = await ageCohortAnalyzer.updateCohortPreferences('25-34', [
  {
    contentType: 'initiative',
    engagementRate: 0.75,
    impressions: 1000,
    clicks: 750,
  },
]);
```

**Parameters:**
- `cohort` (AgeCohort): Target cohort
- `engagementData` (Array): Recent engagement metrics

**Returns:** Promise<CohortPreferences> with updated weights

**Algorithm:**
- Uses learning rate of 0.1 for gradual adjustments
- Increases weight for high engagement (> 0.5)
- Decreases weight for low engagement (< 0.5)
- Keeps weights between 0.1 and 1.0

### `getCohortEngagementMetrics(cohort: AgeCohort, days?: number): Promise<EngagementData[]>`

Fetches engagement metrics for a cohort from the database.

```typescript
const metrics = await ageCohortAnalyzer.getCohortEngagementMetrics('18-24', 7);
```

**Parameters:**
- `cohort` (AgeCohort): Target cohort
- `days` (number, optional): Days to look back (default: 7)

**Returns:** Promise<EngagementData[]> with aggregated metrics by content type

## Usage Examples

### Basic Cohort Determination

```typescript
import { ageCohortAnalyzer } from './services/ageCohortAnalyzer.service';

// During user registration
const userAge = 25;
const cohort = ageCohortAnalyzer.determineCohort(userAge);
console.log(cohort); // '25-34'
```

### Complete User Analysis

```typescript
// Get full analysis with preferences
const analysis = await ageCohortAnalyzer.analyzeUser(userAge);

// Use in user profile
await supabase
  .from('user_profiles')
  .update({
    age_cohort: analysis.cohort,
    age: analysis.age,
  })
  .eq('user_id', userId);
```

### Content Curation Integration

```typescript
// In content curation service
const userCohort = user.ageCohort || ageCohortAnalyzer.determineCohort(user.age);
const preferences = await ageCohortAnalyzer.getCohortPreferences(userCohort);

// Use preferences for scoring
const contentScore = calculateScore(content, preferences);
```

### Scheduled Preference Updates

```typescript
// Run daily to update preferences based on engagement
async function dailyPreferenceUpdate() {
  const cohorts = ['13-17', '18-24', '25-34', '35-49', '50+'];
  
  for (const cohort of cohorts) {
    const metrics = await ageCohortAnalyzer.getCohortEngagementMetrics(cohort, 7);
    if (metrics.length > 0) {
      await ageCohortAnalyzer.updateCohortPreferences(cohort, metrics);
    }
  }
}
```

## Database Schema

The service interacts with the following tables:

### `curation_rules`
Stores custom cohort preferences and rules.

```sql
CREATE TABLE curation_rules (
  id UUID PRIMARY KEY,
  cohort VARCHAR(10) NOT NULL,
  rule_type VARCHAR(20) NOT NULL,
  condition JSONB NOT NULL,
  action JSONB NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### `cohort_engagement_metrics`
Stores engagement data for adaptive learning.

```sql
CREATE TABLE cohort_engagement_metrics (
  id UUID PRIMARY KEY,
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
```

## Requirements Mapping

This service implements the following requirements:

- **B1.1**: Youth content prioritization (13-24)
- **B2.1**: Professional content personalization (25-49)
- **B3.1**: Senior content personalization (50+)
- **B7.2**: Adaptive learning from engagement patterns
- **B7.3**: Cohort preference updates based on behavior

## Testing

Unit tests are available in `ageCohortAnalyzer.service.test.ts`:

```bash
npm test -- ageCohortAnalyzer --run
```

Test coverage includes:
- Cohort determination for all age ranges
- Edge cases (boundaries, invalid ages)
- Default preference retrieval
- Filter rule validation
- Adaptive learning algorithm
- Weight boundary enforcement

## Performance Considerations

- **Cohort Determination**: O(1) - Simple range checks
- **Default Preferences**: O(1) - In-memory lookup
- **Database Preferences**: Cached for 1 hour (configurable)
- **Engagement Metrics**: Indexed by cohort and date
- **Preference Updates**: Batched daily to reduce database load

## Future Enhancements

1. **Machine Learning Integration**: Replace rule-based preferences with ML models
2. **Multi-Dimensional Profiling**: Consider location, interests, and skills
3. **Temporal Patterns**: Learn time-of-day and seasonal preferences
4. **A/B Testing**: Test different preference configurations
5. **Real-Time Updates**: Stream engagement data for instant adaptation

## Related Services

- **ContentCurationService**: Uses cohort preferences for scoring
- **ScoringEngine**: Applies cohort weights to content
- **EngagementTracker**: Provides data for adaptive learning
- **DashboardService**: Displays age-curated content

## Support

For questions or issues, refer to:
- Design Document: `.kiro/specs/v1-major-release/design.md`
- Requirements: `.kiro/specs/v1-major-release/requirements.md`
- Examples: `ageCohortAnalyzer.example.ts`
