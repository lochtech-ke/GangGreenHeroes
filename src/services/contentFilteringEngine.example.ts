/**
 * Content Filtering Engine - Usage Examples
 * 
 * Demonstrates how to use the Content Filtering Engine for age-based content filtering
 */

import {
  contentFilteringEngine,
  FilterableContentItem,
} from './contentFilteringEngine.service';
import { AgeCohort } from '../types/contentCuration.types';

// ============================================================================
// Example 1: Basic Filtering for Minors (13-17)
// ============================================================================

export function exampleMinorFiltering() {
  console.log('=== Example 1: Filtering for Minors (13-17) ===\n');

  const contents: FilterableContentItem[] = [
    {
      id: '1',
      type: 'challenge',
      title: 'School Tree Planting Challenge',
      description: 'Join your classmates in planting trees',
      relevanceScore: 0.9,
      metadata: {
        participationType: 'physical',
        requiresFinancialContribution: false,
      },
      createdAt: new Date(),
    },
    {
      id: '2',
      type: 'initiative',
      title: 'Carbon Credit Investment',
      description: 'Invest in verified carbon credits',
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
    {
      id: '3',
      type: 'petition',
      title: 'Ban Single-Use Plastics',
      description: 'Sign the petition to ban plastic bags',
      relevanceScore: 0.85,
      metadata: {
        requiresAdultStatus: true,
      },
      createdAt: new Date(),
    },
    {
      id: '4',
      type: 'social_post',
      title: 'Share Your Climate Action',
      description: 'Post your environmental activities',
      relevanceScore: 0.95,
      metadata: {
        participationType: 'digital',
      },
      createdAt: new Date(),
    },
  ];

  const filtered = contentFilteringEngine.filterByAgeCohort(contents, '13-17');

  console.log(`Total content items: ${contents.length}`);
  console.log(`Filtered items for minors: ${filtered.length}\n`);

  console.log('Included items:');
  filtered.forEach(item => {
    console.log(`  - ${item.title} (${item.type})`);
  });

  console.log('\nExcluded items:');
  const excluded = contents.filter(c => !filtered.find(f => f.id === c.id));
  excluded.forEach(item => {
    console.log(`  - ${item.title} (${item.type})`);
    if (item.metadata.requiresFinancialContribution) {
      console.log('    Reason: Requires financial contribution');
    }
    if (item.metadata.requiresAdultStatus) {
      console.log('    Reason: Requires adult status');
    }
  });

  console.log('\n');
}

// ============================================================================
// Example 2: Filtering for Youth (18-24)
// ============================================================================

export function exampleYouthFiltering() {
  console.log('=== Example 2: Filtering for Youth (18-24) ===\n');

  const contents: FilterableContentItem[] = [
    {
      id: '1',
      type: 'mission',
      title: 'Community Cleanup Drive',
      description: 'Join us for a weekend cleanup',
      relevanceScore: 0.9,
      metadata: {
        participationType: 'physical',
        financialRequirement: {
          amount: 500,
          currency: 'KES',
          type: 'donation',
        },
      },
      createdAt: new Date(),
    },
    {
      id: '2',
      type: 'initiative',
      title: 'Major Reforestation Project',
      description: 'Large-scale tree planting initiative',
      relevanceScore: 0.85,
      metadata: {
        financialRequirement: {
          amount: 50000,
          currency: 'KES',
          type: 'investment',
        },
      },
      createdAt: new Date(),
    },
    {
      id: '3',
      type: 'challenge',
      title: 'Zero Waste Challenge',
      description: '30-day zero waste lifestyle challenge',
      relevanceScore: 0.95,
      metadata: {
        participationType: 'hybrid',
      },
      createdAt: new Date(),
    },
  ];

  const filtered = contentFilteringEngine.filterByAgeCohort(contents, '18-24');

  console.log(`Total content items: ${contents.length}`);
  console.log(`Filtered items for youth: ${filtered.length}\n`);

  console.log('Included items:');
  filtered.forEach(item => {
    console.log(`  - ${item.title} (${item.type})`);
    if (item.metadata.financialRequirement) {
      console.log(`    Financial requirement: ${item.metadata.financialRequirement.amount} ${item.metadata.financialRequirement.currency}`);
    }
  });

  console.log('\n');
}

// ============================================================================
// Example 3: Detailed Filtering with Statistics
// ============================================================================

export function exampleDetailedFiltering() {
  console.log('=== Example 3: Detailed Filtering with Statistics ===\n');

  const contents: FilterableContentItem[] = [
    {
      id: '1',
      type: 'educational',
      title: 'Climate Science 101',
      description: 'Learn about climate change',
      relevanceScore: 0.8,
      metadata: {},
      createdAt: new Date(),
    },
    {
      id: '2',
      type: 'initiative',
      title: 'Adult-Only Policy Forum',
      description: 'Discuss environmental policy',
      relevanceScore: 0.75,
      metadata: {
        requiresAdultStatus: true,
      },
      createdAt: new Date(),
    },
    {
      id: '3',
      type: 'mission',
      title: 'Paid Conservation Work',
      description: 'Earn while conserving',
      relevanceScore: 0.85,
      metadata: {
        requiresFinancialContribution: true,
      },
      createdAt: new Date(),
    },
  ];

  const result = contentFilteringEngine.filterWithDetails(contents, '13-17');

  console.log('Filter Statistics:');
  console.log(`  Cohort: ${result.filterStats.cohort}`);
  console.log(`  Total items: ${result.filterStats.totalItems}`);
  console.log(`  Included items: ${result.filterStats.includedItems}`);
  console.log(`  Excluded items: ${result.filterStats.excludedItems}`);
  console.log('\nExclusion Breakdown:');
  Object.entries(result.filterStats.filterBreakdown).forEach(([filter, count]) => {
    console.log(`  ${filter}: ${count}`);
  });

  console.log('\n');
}

// ============================================================================
// Example 4: Age Targeting
// ============================================================================

export function exampleAgeTargeting() {
  console.log('=== Example 4: Age Targeting ===\n');

  const content: FilterableContentItem = {
    id: '1',
    type: 'initiative',
    title: 'Young Professionals Climate Network',
    description: 'Network for climate-conscious professionals',
    relevanceScore: 0.9,
    ageTargeting: [
      { minAge: 25, maxAge: 34 },
      { minAge: 35, maxAge: 49 },
    ],
    metadata: {},
    createdAt: new Date(),
  };

  const cohorts: AgeCohort[] = ['13-17', '18-24', '25-34', '35-49', '50+'];

  console.log(`Content: ${content.title}`);
  console.log('Age targeting: 25-34, 35-49\n');

  cohorts.forEach(cohort => {
    const filtered = contentFilteringEngine.filterByAgeCohort([content], cohort);
    const included = filtered.length > 0;
    console.log(`  ${cohort}: ${included ? '✓ Included' : '✗ Excluded'}`);
  });

  console.log('\n');
}

// ============================================================================
// Example 5: Professional Content (25-49)
// ============================================================================

export function exampleProfessionalFiltering() {
  console.log('=== Example 5: Professional Content (25-49) ===\n');

  const contents: FilterableContentItem[] = [
    {
      id: '1',
      type: 'initiative',
      title: 'Carbon Credit Trading Platform',
      description: 'Trade verified carbon credits',
      relevanceScore: 0.9,
      metadata: {
        carbonCreditAvailable: true,
        financialRequirement: {
          amount: 100000,
          currency: 'KES',
          type: 'investment',
        },
      },
      createdAt: new Date(),
    },
    {
      id: '2',
      type: 'mission',
      title: 'Corporate Sustainability Consulting',
      description: 'Help businesses go green',
      relevanceScore: 0.85,
      metadata: {
        professionalSkillsRequired: ['sustainability', 'consulting'],
      },
      createdAt: new Date(),
    },
    {
      id: '3',
      type: 'community_post',
      title: 'Workplace Green Team',
      description: 'Start a green team at work',
      relevanceScore: 0.8,
      metadata: {
        participationType: 'hybrid',
      },
      createdAt: new Date(),
    },
  ];

  const filtered = contentFilteringEngine.filterByAgeCohort(contents, '35-49');

  console.log(`Total content items: ${contents.length}`);
  console.log(`Filtered items for professionals: ${filtered.length}\n`);

  console.log('All items included (no exclusion filters for professionals):');
  filtered.forEach(item => {
    console.log(`  - ${item.title} (${item.type})`);
  });

  console.log('\n');
}

// ============================================================================
// Example 6: Senior Content (50+)
// ============================================================================

export function exampleSeniorFiltering() {
  console.log('=== Example 6: Senior Content (50+) ===\n');

  const contents: FilterableContentItem[] = [
    {
      id: '1',
      type: 'initiative',
      title: 'Legacy Forest Project',
      description: 'Create a lasting environmental legacy',
      relevanceScore: 0.95,
      metadata: {
        legacyProject: true,
        physicalIntensity: 'low',
      },
      createdAt: new Date(),
    },
    {
      id: '2',
      type: 'mission',
      title: 'Environmental Advisory Board',
      description: 'Share your wisdom with the community',
      relevanceScore: 0.9,
      metadata: {
        advisoryRole: true,
        participationType: 'remote',
      },
      createdAt: new Date(),
    },
    {
      id: '3',
      type: 'educational',
      title: 'Long-term Climate Impact Study',
      description: 'Understanding multi-generational effects',
      relevanceScore: 0.85,
      metadata: {
        category: 'long_term_impact',
      },
      createdAt: new Date(),
    },
  ];

  const filtered = contentFilteringEngine.filterByAgeCohort(contents, '50+');

  console.log(`Total content items: ${contents.length}`);
  console.log(`Filtered items for seniors: ${filtered.length}\n`);

  console.log('All items included (no exclusion filters for seniors):');
  filtered.forEach(item => {
    console.log(`  - ${item.title} (${item.type})`);
  });

  console.log('\n');
}

// ============================================================================
// Example 7: Content Validation
// ============================================================================

export function exampleContentValidation() {
  console.log('=== Example 7: Content Validation ===\n');

  const validContent: FilterableContentItem = {
    id: '1',
    type: 'initiative',
    title: 'Adult Climate Forum',
    description: 'Policy discussion for adults',
    relevanceScore: 0.8,
    ageTargeting: [{ minAge: 18, maxAge: 120 }],
    metadata: {
      requiresAdultStatus: true,
    },
    createdAt: new Date(),
  };

  const invalidContent: FilterableContentItem = {
    id: '2',
    type: 'initiative',
    title: 'Conflicting Age Requirements',
    description: 'This has conflicting metadata',
    relevanceScore: 0.8,
    ageTargeting: [{ minAge: 13, maxAge: 17 }], // Targets minors
    metadata: {
      requiresAdultStatus: true, // But requires adult status
    },
    createdAt: new Date(),
  };

  console.log('Valid content:');
  const validation1 = contentFilteringEngine.validateContentMetadata(validContent);
  console.log(`  ${validContent.title}`);
  console.log(`  Valid: ${validation1.valid}`);
  console.log(`  Warnings: ${validation1.warnings.length}\n`);

  console.log('Invalid content:');
  const validation2 = contentFilteringEngine.validateContentMetadata(invalidContent);
  console.log(`  ${invalidContent.title}`);
  console.log(`  Valid: ${validation2.valid}`);
  console.log(`  Warnings:`);
  validation2.warnings.forEach(warning => {
    console.log(`    - ${warning}`);
  });

  console.log('\n');
}

// ============================================================================
// Run All Examples
// ============================================================================

export function runAllExamples() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Content Filtering Engine - Usage Examples               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  exampleMinorFiltering();
  exampleYouthFiltering();
  exampleDetailedFiltering();
  exampleAgeTargeting();
  exampleProfessionalFiltering();
  exampleSeniorFiltering();
  exampleContentValidation();

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   All examples completed!                                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');
}

// Uncomment to run examples
// runAllExamples();
