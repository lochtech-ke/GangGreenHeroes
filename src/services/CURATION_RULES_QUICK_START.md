# Curation Rules Quick Start Guide

## What are Curation Rules?

Curation rules control how content is personalized for different age groups on the #GangGreen platform. They allow administrators to boost, penalize, filter, or exclude content based on various conditions.

## Quick Setup

### 1. Import the Service

```typescript
import { curationRulesService } from './services/curationRules.service';
```

### 2. Create Your First Rule

```typescript
// Boost missions for young adults (18-24)
const rule = await curationRulesService.createRule({
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
  createdBy: 'your-user-id',
});

console.log('Rule created:', rule.id);
```

### 3. Test the Rule

```typescript
// Test before activating
const testContent = [
  {
    id: 'mission-1',
    type: 'mission',
    title: 'Tree Planting',
    description: 'Plant trees in Karura Forest',
    relevanceScore: 50,
    metadata: {},
    createdAt: new Date(),
  },
];

const testContext = {
  user: {
    userId: 'test-user',
    age: 20,
    ageCohort: '18-24',
    interests: ['trees'],
    userType: 'individual',
  },
  cohort: '18-24',
  personalHistory: {
    totalInteractions: 10,
    contentTypeBreakdown: { mission: 5 },
    recentInteractions: [],
    engagementScore: 0.7,
    lastActivity: new Date(),
  },
  cohortPreferences: {
    contentTypes: { mission: 0.8 },
    engagementPatterns: [],
    filterRules: [],
    lastCalculated: new Date(),
  },
  timestamp: new Date(),
};

const result = await curationRulesService.testRule(rule, testContent, testContext);
console.log('Test results:', result);
// Shows: base score 50 → boosted to 75 (50 * 1.5)
```

### 4. View Rules

```typescript
// Get all active rules for a cohort
const rules = await curationRulesService.getRulesForCohort('18-24');
console.log(`Found ${rules.length} active rules`);
```

## Common Use Cases

### Boost Content Type

```typescript
// Boost educational content for seniors
await curationRulesService.createRule({
  cohort: '50+',
  ruleType: 'boost',
  condition: 'content_type',
  parameters: { contentType: 'educational' },
  action: {
    type: 'multiply_score',
    value: 1.4,
    reason: 'Seniors value educational content',
  },
  priority: 500,
  isActive: true,
  createdBy: 'admin-id',
});
```

### Exclude Inappropriate Content

```typescript
// Exclude adult content for minors
await curationRulesService.createRule({
  cohort: '13-17',
  ruleType: 'exclude',
  condition: 'age_range',
  parameters: { minAge: 18, maxAge: 120 },
  action: {
    type: 'exclude',
    value: true,
    reason: 'Content requires adult status',
  },
  priority: 900,
  isActive: true,
  createdBy: 'admin-id',
});
```

### Boost Local Content

```typescript
// Boost content from user's county
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

### Penalize Low Engagement

```typescript
// Penalize content with low engagement history
await curationRulesService.createRule({
  cohort: '18-24',
  ruleType: 'penalize',
  condition: 'engagement_history',
  parameters: {
    metric: 'engagement_score',
    threshold: 0.3,
  },
  action: {
    type: 'multiply_score',
    value: 0.7,
    reason: 'Low engagement content',
  },
  priority: 300,
  isActive: true,
  createdBy: 'admin-id',
});
```

## Rule Components

### Cohorts
- `13-17`: Minors
- `18-24`: Young adults
- `25-34`: Young professionals
- `35-49`: Mid-career professionals
- `50+`: Seniors

### Rule Types
- `boost`: Increase relevance scores
- `penalize`: Decrease relevance scores
- `filter`: Include/exclude based on conditions
- `exclude`: Remove content entirely

### Conditions
- `age_range`: Match by age
- `content_type`: Match by content type
- `location`: Match by geography
- `interest`: Match by user interests
- `engagement_history`: Match by engagement patterns

### Actions
- `multiply_score`: Multiply score by factor (0-10)
- `add_score`: Add/subtract points (-100 to 100)
- `set_score`: Set to specific value (0-100)
- `exclude`: Remove from results
- `require`: Include only if condition met

## Priority Guidelines

- **900-1000**: Critical (safety, legal)
- **700-899**: Important
- **400-699**: Standard
- **100-399**: Minor
- **0-99**: Experimental

Higher priority rules are applied first.

## Management Operations

### Update a Rule

```typescript
await curationRulesService.updateRule('rule-id', {
  priority: 600,
  action: {
    type: 'multiply_score',
    value: 1.8,
    reason: 'Increased boost based on metrics',
  },
});
```

### Deactivate a Rule

```typescript
// Temporarily disable without deleting
await curationRulesService.deactivateRule('rule-id');
```

### Reactivate a Rule

```typescript
await curationRulesService.activateRule('rule-id');
```

### Delete a Rule

```typescript
// Permanent deletion
await curationRulesService.deleteRule('rule-id');
```

## Validation

Rules are automatically validated:

```typescript
try {
  await curationRulesService.createRule(invalidRule);
} catch (error) {
  console.error('Validation failed:', error.message);
  // Example: "Rule validation failed: Priority must be between 0 and 1000"
}
```

## Testing Best Practices

1. **Always test first**: Use `testRule()` before activating
2. **Test multiple items**: Include various content types
3. **Check edge cases**: Test boundary conditions
4. **Monitor results**: Track engagement after activation

## Troubleshooting

### Rule Not Applied?

Check:
- Rule is active (`isActive: true`)
- Priority is set correctly
- Condition matches your content
- Wait 5 minutes for cache refresh

### Validation Error?

Common fixes:
- Check cohort value is valid
- Ensure action value is in range
- Verify all required parameters
- Review action type matches rule type

### Unexpected Results?

Debug:
- Use `testRule()` to see exact effects
- Check rule priority order
- Review condition parameters
- Verify content metadata

## Next Steps

1. **Read Full Documentation**: See `README_CURATION_RULES.md`
2. **Review Examples**: Check existing rules in database
3. **Monitor Metrics**: Track engagement after rule changes
4. **Iterate**: Adjust rules based on data

## Support

For help:
- Check validation errors in console
- Review test results
- Consult engagement analytics
- Contact platform administrators

## Quick Reference

```typescript
// Create
const rule = await curationRulesService.createRule(ruleData);

// Read
const rules = await curationRulesService.getRulesForCohort('18-24');
const rule = await curationRulesService.getRule('rule-id');

// Update
await curationRulesService.updateRule('rule-id', updates);

// Delete
await curationRulesService.deleteRule('rule-id');

// Test
const result = await curationRulesService.testRule(rule, content, context);

// Activate/Deactivate
await curationRulesService.activateRule('rule-id');
await curationRulesService.deactivateRule('rule-id');
```

That's it! You're ready to manage curation rules. 🎉
