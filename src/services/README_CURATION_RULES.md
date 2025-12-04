# Curation Rules Service

## Overview

The Curation Rules Service manages age-based content curation rules for the #GangGreen platform. It provides CRUD operations, validation, and preview testing capabilities for administrators to configure how content is personalized for different age cohorts.

## Requirements

- **B4.1**: Display configurable rules for each age cohort
- **B4.2**: Validate changes and apply them within 5 minutes
- **B4.5**: Provide preview mode simulating different age profiles

## Features

### Rule Management

- **Create Rules**: Add new curation rules with validation
- **Update Rules**: Modify existing rules with validation
- **Delete Rules**: Remove rules from the system
- **Get Rules**: Fetch rules by cohort, priority, or ID
- **Activate/Deactivate**: Toggle rule status without deletion

### Rule Validation

The service includes comprehensive validation:

- **Required Fields**: Cohort, rule type, condition, action
- **Value Ranges**: Priority (0-1000), score multipliers (0-10)
- **Logical Consistency**: Warns about conflicting configurations
- **Parameter Validation**: Condition-specific parameter checks

### Preview Testing

Test rules before applying them:

- Simulate rule effects on content items
- View before/after scores
- Test against different age profiles
- Validate rule behavior without affecting production

## Usage

### Basic Operations

```typescript
import { curationRulesService } from './services/curationRules.service';

// Get all active rules for a cohort
const rules = await curationRulesService.getRulesForCohort('18-24');

// Create a new rule
const newRule = await curationRulesService.createRule({
  cohort: '18-24',
  ruleType: 'boost',
  condition: 'content_type',
  parameters: { contentType: 'mission' },
  action: {
    type: 'multiply_score',
    value: 1.5,
    reason: 'Boost missions for young adults',
  },
  priority: 100,
  isActive: true,
  createdBy: 'admin-user-id',
});

// Update a rule
const updated = await curationRulesService.updateRule('rule-id', {
  priority: 150,
  action: {
    type: 'multiply_score',
    value: 1.8,
    reason: 'Increased boost for missions',
  },
});

// Delete a rule
await curationRulesService.deleteRule('rule-id');
```

### Preview Testing

```typescript
// Test a rule before applying
const testContent = [
  {
    id: 'content-1',
    type: 'mission',
    title: 'Tree Planting',
    description: 'Plant 100 trees',
    relevanceScore: 50,
    metadata: {},
    createdAt: new Date(),
  },
];

const testContext = {
  user: {
    userId: 'user-1',
    age: 20,
    ageCohort: '18-24',
    interests: ['trees'],
    userType: 'individual',
  },
  cohort: '18-24',
  personalHistory: {
    totalInteractions: 10,
    contentTypeBreakdown: { mission: 5, challenge: 5 },
    recentInteractions: [],
    engagementScore: 0.7,
    lastActivity: new Date(),
  },
  cohortPreferences: {
    contentTypes: {
      mission: 0.8,
      challenge: 0.9,
      // ... other types
    },
    engagementPatterns: [],
    filterRules: [],
    lastCalculated: new Date(),
  },
  timestamp: new Date(),
};

const testResult = await curationRulesService.testRule(
  newRule,
  testContent,
  testContext
);

console.log('Test Results:', testResult);
// Shows how the rule affects each content item
```

### Activate/Deactivate Rules

```typescript
// Temporarily disable a rule
await curationRulesService.deactivateRule('rule-id');

// Re-enable a rule
await curationRulesService.activateRule('rule-id');
```

## Rule Types

### Filter
Determines which content to include/exclude based on conditions.

### Boost
Increases relevance scores for matching content.

### Penalize
Decreases relevance scores for matching content.

### Exclude
Completely removes matching content from results.

## Conditions

### age_range
Match content based on user age.

**Parameters:**
- `minAge`: Minimum age (13-120)
- `maxAge`: Maximum age (13-120)

### content_type
Match specific content types.

**Parameters:**
- `contentType`: One of: initiative, social_post, challenge, educational, mission, community_post, petition

### location
Match content by geographic location.

**Parameters:**
- `county`: County name
- `subCounty`: Sub-county name (optional)

### interest
Match content based on user interests.

**Parameters:**
- `interest`: Interest category

### engagement_history
Match based on user engagement patterns.

**Parameters:**
- `metric`: Metric to evaluate (total_interactions, engagement_score, etc.)
- `threshold`: Minimum value required

## Actions

### multiply_score
Multiplies the relevance score by a factor.

**Value Range:** 0-10
**Example:** `{ type: 'multiply_score', value: 1.5, reason: 'Boost by 50%' }`

### add_score
Adds a fixed amount to the relevance score.

**Value Range:** -100 to 100
**Example:** `{ type: 'add_score', value: 20, reason: 'Add 20 points' }`

### set_score
Sets the relevance score to a specific value.

**Value Range:** 0-100
**Example:** `{ type: 'set_score', value: 75, reason: 'High priority' }`

### exclude
Removes content from results (sets score to 0).

**Value:** true/false
**Example:** `{ type: 'exclude', value: true, reason: 'Not age-appropriate' }`

### require
Includes content only if condition is met.

**Value:** true/false
**Example:** `{ type: 'require', value: true, reason: 'Must match criteria' }`

## Validation

The service validates rules before creation or update:

### Automatic Validation
- Required fields presence
- Valid cohort values
- Valid rule types and conditions
- Parameter completeness
- Value ranges
- Logical consistency

### Validation Results

```typescript
interface RuleValidationResult {
  valid: boolean;
  errors: string[];    // Blocking issues
  warnings: string[];  // Non-blocking concerns
}
```

**Errors** prevent rule creation/update.
**Warnings** are logged but don't block operations.

## Priority System

Rules are applied in priority order (highest first):

- **Priority Range:** 0-1000
- **Higher Priority:** Applied first
- **Same Priority:** Applied in creation order

### Priority Guidelines

- **900-1000**: Critical exclusions (safety, legal)
- **700-899**: Important boosts/penalties
- **400-699**: Standard adjustments
- **100-399**: Minor tweaks
- **0-99**: Experimental rules

## Database Schema

Rules are stored in the `curation_rules` table:

```sql
CREATE TABLE curation_rules (
  id UUID PRIMARY KEY,
  cohort VARCHAR(10) NOT NULL,
  rule_type VARCHAR(20) NOT NULL,
  condition VARCHAR(50) NOT NULL,
  parameters JSONB NOT NULL,
  action JSONB NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Performance Considerations

### Caching
- Rules are cached per cohort
- Cache TTL: 5 minutes (per requirement B4.2)
- Automatic cache invalidation on updates

### Query Optimization
- Indexed by cohort and priority
- Active rules filtered at database level
- Batch operations for multiple cohorts

## Error Handling

The service throws errors for:

- Invalid rule structure
- Missing required fields
- Database connection failures
- Rule not found (for updates/deletes)

All errors include descriptive messages for debugging.

## Testing

### Unit Tests

Run tests with:
```bash
npm run test -- src/services/curationRules.service.test.ts
```

### Test Coverage

- Rule validation (all conditions and actions)
- CRUD operations
- Preview testing
- Error handling
- Edge cases

## Integration

### With Scoring Engine

The scoring engine applies rules when calculating relevance scores:

```typescript
import { scoringEngine } from './scoringEngine.service';
import { curationRulesService } from './curationRules.service';

// Rules are automatically applied during scoring
const score = scoringEngine.calculateScore(item, context);
```

### With Content Curation Service

Rules are fetched and applied during content curation:

```typescript
import { contentCurationService } from './contentCuration.service';

// Rules are automatically loaded for the user's cohort
const curatedContent = await contentCurationService.getCuratedContent(request);
```

## Best Practices

### Rule Design

1. **Start Simple**: Begin with basic rules, add complexity gradually
2. **Test First**: Use preview mode before activating rules
3. **Monitor Impact**: Track engagement metrics after rule changes
4. **Document Reasons**: Always provide clear action reasons
5. **Use Priorities**: Organize rules by importance

### Maintenance

1. **Regular Review**: Audit rules quarterly
2. **Remove Unused**: Delete inactive rules after 90 days
3. **Update Based on Data**: Adjust rules based on engagement metrics
4. **Version Control**: Track rule changes in admin logs

### Performance

1. **Limit Rules**: Keep active rules under 20 per cohort
2. **Optimize Conditions**: Use simple conditions when possible
3. **Batch Updates**: Update multiple rules together
4. **Monitor Query Time**: Track rule evaluation performance

## Troubleshooting

### Rules Not Applied

**Check:**
- Rule is active (`isActive: true`)
- Priority is appropriate
- Condition matches content
- Cache has refreshed (wait 5 minutes)

### Validation Errors

**Common Issues:**
- Invalid cohort value
- Out-of-range action values
- Missing required parameters
- Conflicting rule type and action

### Performance Issues

**Solutions:**
- Reduce number of active rules
- Simplify rule conditions
- Increase cache TTL
- Use batch operations

## API Reference

### CurationRulesService

#### getRulesForCohort(cohort: AgeCohort): Promise<CurationRule[]>
Fetches all active rules for a cohort.

#### createRule(rule: Omit<CurationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<CurationRule>
Creates a new rule with validation.

#### updateRule(ruleId: string, updates: Partial<CurationRule>): Promise<CurationRule>
Updates an existing rule with validation.

#### deleteRule(ruleId: string): Promise<boolean>
Deletes a rule permanently.

#### testRule(rule: Partial<CurationRule>, testContent: CuratedContentItem[], testContext: ScoringContext): Promise<RuleTestResult>
Tests a rule in preview mode.

#### getRule(ruleId: string): Promise<CurationRule | null>
Fetches a single rule by ID.

#### activateRule(ruleId: string): Promise<CurationRule>
Activates a deactivated rule.

#### deactivateRule(ruleId: string): Promise<CurationRule>
Deactivates an active rule.

#### getRulesByPriority(cohort: AgeCohort, minPriority: number, maxPriority: number): Promise<CurationRule[]>
Fetches rules within a priority range.

### RuleValidator

#### validate(rule: Partial<CurationRule>): RuleValidationResult
Validates a rule structure and parameters.

## Examples

### Example 1: Boost Missions for Youth

```typescript
await curationRulesService.createRule({
  cohort: '18-24',
  ruleType: 'boost',
  condition: 'content_type',
  parameters: { contentType: 'mission' },
  action: {
    type: 'multiply_score',
    value: 1.5,
    reason: 'Young adults prefer hands-on missions',
  },
  priority: 500,
  isActive: true,
  createdBy: 'admin-id',
});
```

### Example 2: Exclude Financial Content for Minors

```typescript
await curationRulesService.createRule({
  cohort: '13-17',
  ruleType: 'exclude',
  condition: 'age_range',
  parameters: { minAge: 18, maxAge: 120 },
  action: {
    type: 'exclude',
    value: true,
    reason: 'Financial content requires adult status',
  },
  priority: 900,
  isActive: true,
  createdBy: 'admin-id',
});
```

### Example 3: Boost Local Content

```typescript
await curationRulesService.createRule({
  cohort: '25-34',
  ruleType: 'boost',
  condition: 'location',
  parameters: { county: 'Nairobi' },
  action: {
    type: 'multiply_score',
    value: 1.3,
    reason: 'Prioritize local initiatives',
  },
  priority: 400,
  isActive: true,
  createdBy: 'admin-id',
});
```

## Support

For issues or questions:
- Check validation errors in console
- Review test results in preview mode
- Consult engagement metrics
- Contact platform administrators

## Version History

- **v1.0.0** (2025-01-29): Initial implementation
  - CRUD operations
  - Rule validation
  - Preview testing
  - Priority system
