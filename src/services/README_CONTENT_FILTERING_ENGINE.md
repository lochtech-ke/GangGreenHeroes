# Content Filtering Engine

## Overview

The Content Filtering Engine is a core component of the V1.0 Major Release that implements age-based content filtering to ensure users only see age-appropriate content based on their cohort.

## Requirements

This service implements the following requirements:

- **B1.3**: Filter out content requiring financial contributions above youth capacity (13-24)
- **B1.5**: Exclude content requiring legal adult status or financial transactions for minors (13-17)
- **B2.3**: Include carbon credit investment opportunities for professionals (25-49)
- **B3.3**: Include educational content about long-term environmental impact for seniors (50+)

## Architecture

The filtering engine works in conjunction with other curation components:

```
┌─────────────────────────────────────────────────────────┐
│                  Content Curation Flow                   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Age Cohort Analyzer                         │
│  - Determines user's age cohort (13-17, 18-24, etc.)   │
│  - Retrieves cohort preferences                         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│           Content Filtering Engine (THIS)                │
│  - Applies age-based exclusion filters                  │
│  - Checks age targeting restrictions                    │
│  - Validates content metadata                           │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 Scoring Engine                           │
│  - Calculates relevance scores                          │
│  - Applies cohort-based boosts                          │
│  - Ranks filtered content                               │
└─────────────────────────────────────────────────────────┘
```

## Filter Rules by Cohort

### Minors (13-17)

**Exclusion Filters:**
- ❌ Content requiring adult status (`requiresAdultStatus: true`)
- ❌ Content requiring legal age (`requiresLegalAge: true`)
- ❌ Content requiring financial contributions (`requiresFinancialContribution: true`)
- ❌ Content with any financial requirements (`financialRequirement` present)

**Rationale:** Protect minors from age-inappropriate content and financial obligations.

### Youth (18-24)

**Exclusion Filters:**
- ❌ Content with high financial requirements (> 5000 KES)

**Rationale:** Filter content beyond typical youth financial capacity while allowing adult content.

### Professionals (25-49)

**Exclusion Filters:**
- ✅ None - All content types allowed

**Inclusion Boosts** (handled by Scoring Engine):
- ⬆️ Carbon credit investment opportunities
- ⬆️ Donation-based initiatives
- ⬆️ Professional skill matches
- ⬆️ Corporate partnerships

**Rationale:** Professionals have full access with content boosted based on their capacity.

### Seniors (50+)

**Exclusion Filters:**
- ✅ None - All content types allowed

**Inclusion Boosts** (handled by Scoring Engine):
- ⬆️ Legacy projects
- ⬆️ Advisory roles
- ⬆️ Low physical intensity activities
- ⬆️ Remote participation options
- ⬆️ Long-term impact education

**Rationale:** Seniors have full access with content boosted based on their preferences.

## Usage

### Basic Filtering

```typescript
import { contentFilteringEngine } from './contentFilteringEngine.service';
import { FilterableContentItem } from './contentFilteringEngine.service';

const contents: FilterableContentItem[] = [
  {
    id: '1',
    type: 'initiative',
    title: 'Tree Planting Drive',
    description: 'Community tree planting',
    relevanceScore: 0.9,
    metadata: {
      participationType: 'physical',
    },
    createdAt: new Date(),
  },
  {
    id: '2',
    type: 'initiative',
    title: 'Carbon Credit Investment',
    description: 'Invest in carbon credits',
    relevanceScore: 0.8,
    metadata: {
      requiresFinancialContribution: true,
      financialRequirement: {
        amount: 10000,
        currency: 'KES',
        type: 'investment',
      },
    },
    createdAt: new Date(),
  },
];

// Filter for minors (13-17)
const filtered = contentFilteringEngine.filterByAgeCohort(contents, '13-17');
// Returns only item 1 (item 2 excluded due to financial requirement)
```

### Detailed Filtering with Statistics

```typescript
const result = contentFilteringEngine.filterWithDetails(contents, '13-17');

console.log(result.filterStats);
// {
//   cohort: '13-17',
//   totalItems: 2,
//   includedItems: 1,
//   excludedItems: 1,
//   filterBreakdown: {
//     'requires_financial_contribution': 1
//   }
// }
```

### Age Targeting

```typescript
const content: FilterableContentItem = {
  id: '1',
  type: 'initiative',
  title: 'Young Professionals Network',
  description: 'Network for professionals',
  relevanceScore: 0.9,
  ageTargeting: [
    { minAge: 25, maxAge: 34 },
    { minAge: 35, maxAge: 49 },
  ],
  metadata: {},
  createdAt: new Date(),
};

// Will be included for 25-34 and 35-49
// Will be excluded for 13-17, 18-24, and 50+
const filtered = contentFilteringEngine.filterByAgeCohort([content], '25-34');
```

### Content Validation

```typescript
const content: FilterableContentItem = {
  id: '1',
  type: 'initiative',
  title: 'Conflicting Requirements',
  description: 'This has issues',
  relevanceScore: 0.8,
  ageTargeting: [{ minAge: 13, maxAge: 17 }], // Targets minors
  metadata: {
    requiresAdultStatus: true, // But requires adult status
  },
  createdAt: new Date(),
};

const validation = contentFilteringEngine.validateContentMetadata(content);
// {
//   valid: false,
//   warnings: ['Content requires adult status but targets minors']
// }
```

## Content Metadata

Content items must include metadata for proper filtering:

```typescript
interface FilterableContentItem {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  relevanceScore: number;
  ageTargeting?: AgeRange[];
  metadata: {
    // Financial requirements
    requiresFinancialContribution?: boolean;
    financialRequirement?: {
      amount?: number;
      currency?: string;
      type?: 'donation' | 'purchase' | 'investment' | 'fee';
    };
    
    // Age restrictions
    requiresAdultStatus?: boolean;
    requiresLegalAge?: boolean;
    
    // Activity characteristics
    physicalIntensity?: 'low' | 'medium' | 'high';
    participationType?: 'digital' | 'physical' | 'hybrid' | 'remote';
    
    // Professional features
    professionalSkillsRequired?: string[];
    carbonCreditAvailable?: boolean;
    
    // Senior features
    legacyProject?: boolean;
    advisoryRole?: boolean;
    mentorshipOpportunity?: boolean;
    
    [key: string]: any;
  };
  createdAt: Date;
}
```

## Filter Statistics

Get detailed statistics about filtering:

```typescript
const stats = contentFilteringEngine.getFilterStatistics(contents, '13-17');
// {
//   totalItems: 10,
//   filteredItems: 7,
//   excludedItems: 3,
//   exclusionReasons: {
//     'requires_adult_status': 2,
//     'requires_financial_contribution': 1
//   }
// }
```

## Integration with Other Services

### With Age Cohort Analyzer

```typescript
import { ageCohortAnalyzer } from './ageCohortAnalyzer.service';
import { contentFilteringEngine } from './contentFilteringEngine.service';

// Determine user's cohort
const userAge = 16;
const cohortInfo = await ageCohortAnalyzer.analyzeUser(userAge);

// Filter content for that cohort
const filtered = contentFilteringEngine.filterByAgeCohort(
  contents,
  cohortInfo.cohort
);
```

### With Scoring Engine

```typescript
import { contentFilteringEngine } from './contentFilteringEngine.service';
import { scoringEngine } from './scoringEngine.service';

// 1. Filter content by age appropriateness
const filtered = contentFilteringEngine.filterByAgeCohort(contents, cohort);

// 2. Score and rank the filtered content
const scored = await scoringEngine.scoreContent(filtered, scoringContext);

// 3. Sort by relevance score
const ranked = scored.sort((a, b) => b.finalScore - a.finalScore);
```

## Testing

The filtering engine includes comprehensive unit tests:

```bash
npm test src/services/contentFilteringEngine.service.test.ts
```

Test coverage includes:
- Age targeting logic
- Minor filters (B1.3, B1.5)
- Youth filters (B1.3)
- Professional filters (B2.3)
- Senior filters (B3.3)
- Batch filtering
- Edge cases
- Content validation

## Examples

See `contentFilteringEngine.example.ts` for detailed usage examples:

```bash
# Run examples
npx ts-node src/services/contentFilteringEngine.example.ts
```

## Performance Considerations

- **Filtering is synchronous** and fast (< 1ms per item)
- **No database calls** - operates on in-memory data
- **Batch processing** - filter multiple items efficiently
- **Caching** - Results can be cached by the curation service

## Best Practices

1. **Always validate content metadata** before storing in database
2. **Use age targeting** to explicitly control content visibility
3. **Set financial requirements** accurately for proper filtering
4. **Test content** across all cohorts before publishing
5. **Monitor filter statistics** to ensure content reaches intended audiences

## Future Enhancements

- Machine learning-based content classification
- Dynamic financial thresholds based on regional economics
- Multi-dimensional filtering (location, interests, skills)
- A/B testing for filter rules
- Real-time filter rule updates

## Related Documentation

- [Age Cohort Analyzer](./README_AGE_COHORT_ANALYZER.md)
- [Scoring Engine](./scoringEngine.service.ts)
- [Content Curation Types](../types/contentCuration.types.ts)
- [V1.0 Design Document](../../.kiro/specs/v1-major-release/design.md)
