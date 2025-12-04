# Recommendation Engine

## Overview

The Recommendation Engine is an age-aware, context-aware system that generates personalized climate action recommendations for users. It implements requirements A2.1 and A2.5 from the V1.0 Major Release specification.

## Architecture

### Components

1. **RecommendationEngineService** (`recommendationEngine.service.ts`)
   - Core recommendation logic
   - Age-based content filtering and scoring
   - Context-aware relevance calculation
   - Adaptive weighting based on user history

2. **AICompanionService** (`aiCompanion.service.ts`)
   - Integration point for recommendations
   - AI-enhanced descriptions (future)
   - Chat-based recommendation delivery

## Key Features

### 1. Age-Aware Recommendations

The engine tailors recommendations based on user age cohorts:

- **13-17 (Minors)**: Social campaigns, peer challenges, gamified activities
  - Excludes: Financial transactions, adult-only content
  - Engagement style: Digital-first
  
- **18-24 (Young Adults)**: Volunteering, activism, learning
  - Engagement style: Hybrid (digital + physical)
  
- **25-34 (Young Professionals)**: Donations, skilled volunteering, corporate partnerships
  - Engagement style: Hybrid
  - Financial capacity: Medium
  
- **35-49 (Mid-Career)**: Leadership, mentorship, advocacy
  - Engagement style: Physical-first
  - Financial capacity: High
  
- **50+ (Seniors)**: Legacy projects, advisory roles, major donations
  - Engagement style: Physical, flexible
  - Financial capacity: High

### 2. Context-Aware Scoring

Recommendations are scored based on multiple factors:

- **Interest Matching** (30%): Alignment with user's stated climate interests
- **Location Relevance** (20%): Geographic proximity to user
- **Recency** (10%): Newer content gets higher scores
- **Diversity** (-20%): Penalty for repetitive content
- **Popularity** (10%): Community engagement metrics

### 3. Adaptive Weighting

The engine implements Property B13 from the specification:

- **< 10 interactions**: 80% cohort-based, 20% personal history
- **10-50 interactions**: 50% cohort-based, 50% personal history
- **> 50 interactions**: 30% cohort-based, 70% personal history

This ensures new users get age-appropriate recommendations while experienced users get highly personalized suggestions.

## Usage

### Basic Recommendation Request

```typescript
import { recommendationEngineService } from './services/recommendationEngine.service';

const recommendations = await recommendationEngineService.generateRecommendations({
  userId: 'user-123',
  userInterests: ['trees', 'water'],
  ageCohort: '18-24',
  location: {
    county: 'Nairobi',
    subCounty: 'Westlands'
  },
  limit: 5
});
```

### Contextual Suggestions

```typescript
const suggestions = await recommendationEngineService.getContextualSuggestions(
  'user-123',
  {
    userInterests: ['trees'],
    ageCohort: '25-34',
    currentPage: '/missions',
    recentActions: ['joined_mission', 'completed_learning'],
    journeyStage: 'contribution',
    location: { county: 'Nairobi' }
  }
);
```

### Through AI Companion

```typescript
import { aiCompanionService } from './services/aiCompanion.service';

const recommendations = await aiCompanionService.getRecommendations({
  userId: 'user-123',
  userInterests: ['waste', 'policy'],
  ageCohort: '35-49',
  limit: 3
});
```

## Scoring Algorithm

### Final Score Calculation

```
finalScore = (baseScore × 0.2) + (ageScore × cohortWeight) + (contextScore × personalWeight)
```

Where:
- **baseScore**: Content quality/completeness (0.7 default)
- **ageScore**: Age cohort preference weight (0-1)
- **contextScore**: Context-based relevance (0-1)
- **cohortWeight**: Adaptive weight based on interaction count
- **personalWeight**: Adaptive weight based on interaction count

### Age Score

Based on cohort preferences for each content type:

```typescript
const cohortWeights = {
  '13-17': {
    challenge: 1.0,
    social_post: 0.9,
    mission: 0.8,
    // ...
  },
  // ... other cohorts
};
```

### Context Score

```
contextScore = 0.5 (base)
  + interestMatch × 0.3
  + locationMatch × 0.2
  + recencyScore × 0.1
  - diversityPenalty × 0.2
  + popularityScore × 0.1
```

## Content Filtering

### Age-Appropriate Filtering

The engine automatically filters out inappropriate content:

1. **Minors (13-17)**:
   - ❌ Content requiring payment
   - ❌ Content requiring adult legal status
   - ❌ High-cost initiatives (>1000 KES)

2. **Youth (13-24)**:
   - ❌ High-cost initiatives (>1000 KES)

3. **All Ages**:
   - ✅ Content explicitly tagged for their cohort
   - ✅ General content without restrictions

## Data Sources

The engine fetches candidate content from:

1. **Missions** (`missions` table)
   - Status: 'upcoming'
   - Type: 'mission'

2. **Learning Modules** (`learning_modules` table)
   - Type: 'educational'

3. **Communities** (`communities` table)
   - Type: 'community_post'

4. **Petitions** (`petitions` table)
   - Status: 'active'
   - Type: 'petition'

## Interaction Tracking

The engine uses interaction history to improve recommendations:

```typescript
interface InteractionHistory {
  totalInteractions: number;
  contentTypeBreakdown: Record<ContentType, number>;
  recentInteractions: Interaction[];
  engagementScore: number;
  lastActivity: Date;
}
```

Interaction types and weights:
- **impression**: 0.1
- **click**: 0.3
- **save**: 0.5
- **join**: 0.8
- **share**: 0.7
- **complete**: 1.0

## Fallback Mechanism

When the main engine fails, fallback recommendations are provided:

1. **Interest-based fallbacks**: Based on user's stated interests
2. **Age-appropriate fallbacks**: Generic content for the user's cohort
3. **General fallbacks**: Universal recommendations

## Integration with Content Curation

The recommendation engine is designed to integrate with the Content Curation Engine (when implemented):

- Shares scoring algorithms
- Uses same age cohort definitions
- Compatible with curation rules
- Supports relevance score caching

## Performance Considerations

- **Candidate Limit**: Fetches max 20 items per content type
- **History Limit**: Uses last 50 interactions
- **Caching**: Supports relevance score caching (future)
- **Async Processing**: Non-blocking analytics tracking

## Future Enhancements

1. **AI-Enhanced Descriptions**: Use OpenAI to generate engaging descriptions
2. **Collaborative Filtering**: Learn from similar users
3. **Temporal Patterns**: Time-of-day and seasonal preferences
4. **Social Signals**: Friend activity and social proof
5. **A/B Testing**: Test different scoring strategies
6. **Real-time Updates**: WebSocket-based recommendation updates

## Testing

The recommendation engine should be tested for:

1. **Age Appropriateness**: Verify content filtering by cohort
2. **Adaptive Weighting**: Verify Property B13 implementation
3. **Context Awareness**: Verify interest/location matching
4. **Fallback Behavior**: Verify graceful degradation
5. **Performance**: Verify response times < 500ms

## Related Documentation

- [V1.0 Major Release Design](../../.kiro/specs/v1-major-release/design.md)
- [V1.0 Major Release Requirements](../../.kiro/specs/v1-major-release/requirements.md)
- [Content Curation Types](../types/contentCuration.types.ts)
- [AI Companion Types](../types/aiCompanion.types.ts)
