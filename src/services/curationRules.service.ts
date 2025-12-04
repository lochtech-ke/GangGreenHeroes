/**
 * Curation Rules Service
 * 
 * Manages curation rules for age-based content personalization.
 * Provides CRUD operations, validation, and preview testing for rules.
 * 
 * Requirements: B4.1, B4.2, B4.5
 */

import { supabase } from './supabase';
import {
  CurationRule,
  RuleValidationResult,
  RuleTestResult,
  AgeCohort,
  RuleType,
  RuleCondition,
  RuleAction,
  CuratedContentItem,
  ScoringContext,
} from '../types/contentCuration.types';

// ============================================================================
// Rule Validation
// ============================================================================

/**
 * Validates a curation rule structure and parameters
 * Requirement B4.2: Validate changes and reject invalid rules
 */
export class RuleValidator {
  /**
   * Validates a complete curation rule
   */
  validate(rule: Partial<CurationRule>): RuleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!rule.cohort) {
      errors.push('Cohort is required');
    } else if (!this.isValidCohort(rule.cohort)) {
      errors.push(`Invalid cohort: ${rule.cohort}`);
    }

    if (!rule.ruleType) {
      errors.push('Rule type is required');
    } else if (!this.isValidRuleType(rule.ruleType)) {
      errors.push(`Invalid rule type: ${rule.ruleType}`);
    }

    if (!rule.condition) {
      errors.push('Condition is required');
    } else if (!this.isValidCondition(rule.condition)) {
      errors.push(`Invalid condition: ${rule.condition}`);
    }

    if (!rule.action) {
      errors.push('Action is required');
    } else {
      const actionErrors = this.validateAction(rule.action);
      errors.push(...actionErrors);
    }

    if (!rule.parameters) {
      warnings.push('No parameters specified');
    } else {
      const paramErrors = this.validateParameters(
        rule.condition!,
        rule.parameters
      );
      errors.push(...paramErrors);
    }

    // Validate priority
    if (rule.priority !== undefined) {
      if (rule.priority < 0 || rule.priority > 1000) {
        errors.push('Priority must be between 0 and 1000');
      }
    }

    // Validate logical consistency
    const consistencyWarnings = this.validateConsistency(rule);
    warnings.push(...consistencyWarnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates cohort value
   */
  private isValidCohort(cohort: string): cohort is AgeCohort {
    const validCohorts: AgeCohort[] = ['13-17', '18-24', '25-34', '35-49', '50+'];
    return validCohorts.includes(cohort as AgeCohort);
  }

  /**
   * Validates rule type
   */
  private isValidRuleType(ruleType: string): ruleType is RuleType {
    const validTypes: RuleType[] = ['filter', 'boost', 'penalize', 'exclude'];
    return validTypes.includes(ruleType as RuleType);
  }

  /**
   * Validates condition type
   */
  private isValidCondition(condition: string): condition is RuleCondition {
    const validConditions: RuleCondition[] = [
      'age_range',
      'content_type',
      'location',
      'interest',
      'engagement_history',
    ];
    return validConditions.includes(condition as RuleCondition);
  }

  /**
   * Validates rule action
   */
  private validateAction(action: RuleAction): string[] {
    const errors: string[] = [];

    if (!action.type) {
      errors.push('Action type is required');
      return errors;
    }

    const validActionTypes = [
      'multiply_score',
      'add_score',
      'set_score',
      'exclude',
      'require',
    ];

    if (!validActionTypes.includes(action.type)) {
      errors.push(`Invalid action type: ${action.type}`);
    }

    // Validate action value based on type
    switch (action.type) {
      case 'multiply_score':
        if (typeof action.value !== 'number') {
          errors.push('multiply_score requires a numeric value');
        } else if (action.value < 0 || action.value > 10) {
          errors.push('multiply_score value must be between 0 and 10');
        }
        break;

      case 'add_score':
        if (typeof action.value !== 'number') {
          errors.push('add_score requires a numeric value');
        } else if (action.value < -100 || action.value > 100) {
          errors.push('add_score value must be between -100 and 100');
        }
        break;

      case 'set_score':
        if (typeof action.value !== 'number') {
          errors.push('set_score requires a numeric value');
        } else if (action.value < 0 || action.value > 100) {
          errors.push('set_score value must be between 0 and 100');
        }
        break;

      case 'exclude':
      case 'require':
        if (typeof action.value !== 'boolean') {
          errors.push(`${action.type} requires a boolean value`);
        }
        break;
    }

    if (!action.reason || action.reason.trim().length === 0) {
      errors.push('Action reason is required');
    }

    return errors;
  }

  /**
   * Validates parameters based on condition type
   */
  private validateParameters(
    condition: RuleCondition,
    parameters: Record<string, any>
  ): string[] {
    const errors: string[] = [];

    switch (condition) {
      case 'age_range':
        if (!parameters.minAge || !parameters.maxAge) {
          errors.push('age_range requires minAge and maxAge parameters');
        } else {
          if (parameters.minAge < 13 || parameters.minAge > 120) {
            errors.push('minAge must be between 13 and 120');
          }
          if (parameters.maxAge < 13 || parameters.maxAge > 120) {
            errors.push('maxAge must be between 13 and 120');
          }
          if (parameters.minAge > parameters.maxAge) {
            errors.push('minAge cannot be greater than maxAge');
          }
        }
        break;

      case 'content_type':
        if (!parameters.contentType) {
          errors.push('content_type requires contentType parameter');
        } else {
          const validTypes = [
            'initiative',
            'social_post',
            'challenge',
            'educational',
            'mission',
            'community_post',
            'petition',
          ];
          if (!validTypes.includes(parameters.contentType)) {
            errors.push(`Invalid content type: ${parameters.contentType}`);
          }
        }
        break;

      case 'location':
        if (!parameters.county && !parameters.subCounty) {
          errors.push('location requires county or subCounty parameter');
        }
        break;

      case 'interest':
        if (!parameters.interest) {
          errors.push('interest requires interest parameter');
        }
        break;

      case 'engagement_history':
        if (!parameters.metric) {
          errors.push('engagement_history requires metric parameter');
        }
        if (parameters.threshold !== undefined) {
          if (typeof parameters.threshold !== 'number') {
            errors.push('threshold must be a number');
          }
        }
        break;
    }

    return errors;
  }

  /**
   * Validates logical consistency of the rule
   */
  private validateConsistency(rule: Partial<CurationRule>): string[] {
    const warnings: string[] = [];

    // Check for conflicting rule types
    if (rule.ruleType === 'exclude' && rule.action?.type !== 'exclude') {
      warnings.push('Rule type is "exclude" but action type is not "exclude"');
    }

    // Check for ineffective boosts
    if (
      rule.ruleType === 'boost' &&
      rule.action?.type === 'multiply_score' &&
      typeof rule.action.value === 'number' &&
      rule.action.value < 1
    ) {
      warnings.push('Boost rule has multiplier less than 1, which will reduce scores');
    }

    // Check for ineffective penalties
    if (
      rule.ruleType === 'penalize' &&
      rule.action?.type === 'multiply_score' &&
      typeof rule.action.value === 'number' &&
      rule.action.value > 1
    ) {
      warnings.push('Penalize rule has multiplier greater than 1, which will increase scores');
    }

    return warnings;
  }
}

// ============================================================================
// Curation Rules Service
// ============================================================================

export class CurationRulesService {
  private validator: RuleValidator;

  constructor() {
    this.validator = new RuleValidator();
  }

  /**
   * Gets all active rules for a specific cohort
   * Requirement B4.1: Display configurable rules for each age cohort
   * 
   * @param cohort - Age cohort
   * @returns Array of active curation rules
   */
  async getRulesForCohort(cohort: AgeCohort): Promise<CurationRule[]> {
    try {
      const { data, error } = await supabase
        .from('curation_rules')
        .select('*')
        .eq('cohort', cohort)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) {
        console.error(`Failed to fetch rules for cohort ${cohort}:`, error);
        throw new Error(`Failed to fetch rules: ${error.message}`);
      }

      if (!data) {
        return [];
      }

      // Transform database records to CurationRule objects
      return data.map(record => this.transformDatabaseRecord(record));
    } catch (error) {
      console.error('Error fetching rules for cohort:', error);
      throw error;
    }
  }

  /**
   * Gets all rules (active and inactive) for a cohort
   * 
   * @param cohort - Age cohort
   * @param includeInactive - Whether to include inactive rules
   * @returns Array of curation rules
   */
  async getAllRulesForCohort(
    cohort: AgeCohort,
    includeInactive: boolean = false
  ): Promise<CurationRule[]> {
    try {
      let query = supabase
        .from('curation_rules')
        .select('*')
        .eq('cohort', cohort);

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      query = query.order('priority', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error(`Failed to fetch all rules for cohort ${cohort}:`, error);
        throw new Error(`Failed to fetch rules: ${error.message}`);
      }

      if (!data) {
        return [];
      }

      return data.map(record => this.transformDatabaseRecord(record));
    } catch (error) {
      console.error('Error fetching all rules for cohort:', error);
      throw error;
    }
  }

  /**
   * Creates a new curation rule with validation
   * Requirement B4.2: Validate changes and apply them within 5 minutes
   * 
   * @param rule - Rule to create (without id, createdAt, updatedAt)
   * @returns Created rule with id
   */
  async createRule(
    rule: Omit<CurationRule, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CurationRule> {
    try {
      // Validate the rule
      const validation = this.validator.validate(rule);
      
      if (!validation.valid) {
        throw new Error(
          `Rule validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        console.warn('Rule validation warnings:', validation.warnings);
      }

      // Prepare database record
      const dbRecord = {
        cohort: rule.cohort,
        rule_type: rule.ruleType,
        condition: rule.condition,
        parameters: rule.parameters,
        action: rule.action,
        priority: rule.priority,
        is_active: rule.isActive !== undefined ? rule.isActive : true,
        created_by: rule.createdBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Insert into database
      const { data, error } = await supabase
        .from('curation_rules')
        .insert(dbRecord)
        .select()
        .single();

      if (error) {
        console.error('Failed to create rule:', error);
        throw new Error(`Failed to create rule: ${error.message}`);
      }

      if (!data) {
        throw new Error('Failed to create rule: No data returned');
      }

      return this.transformDatabaseRecord(data);
    } catch (error) {
      console.error('Error creating rule:', error);
      throw error;
    }
  }

  /**
   * Updates an existing curation rule with validation
   * Requirement B4.2: Validate changes and apply them within 5 minutes
   * 
   * @param ruleId - ID of rule to update
   * @param updates - Partial rule updates
   * @returns Updated rule
   */
  async updateRule(
    ruleId: string,
    updates: Partial<Omit<CurationRule, 'id' | 'createdAt' | 'createdBy'>>
  ): Promise<CurationRule> {
    try {
      // Fetch existing rule
      const { data: existing, error: fetchError } = await supabase
        .from('curation_rules')
        .select('*')
        .eq('id', ruleId)
        .single();

      if (fetchError || !existing) {
        throw new Error(`Rule not found: ${ruleId}`);
      }

      // Merge updates with existing rule
      const mergedRule: Partial<CurationRule> = {
        ...this.transformDatabaseRecord(existing),
        ...updates,
      };

      // Validate the merged rule
      const validation = this.validator.validate(mergedRule);
      
      if (!validation.valid) {
        throw new Error(
          `Rule validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        console.warn('Rule validation warnings:', validation.warnings);
      }

      // Prepare update record
      const updateRecord: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.cohort) updateRecord.cohort = updates.cohort;
      if (updates.ruleType) updateRecord.rule_type = updates.ruleType;
      if (updates.condition) updateRecord.condition = updates.condition;
      if (updates.parameters) updateRecord.parameters = updates.parameters;
      if (updates.action) updateRecord.action = updates.action;
      if (updates.priority !== undefined) updateRecord.priority = updates.priority;
      if (updates.isActive !== undefined) updateRecord.is_active = updates.isActive;

      // Update in database
      const { data, error } = await supabase
        .from('curation_rules')
        .update(updateRecord)
        .eq('id', ruleId)
        .select()
        .single();

      if (error) {
        console.error('Failed to update rule:', error);
        throw new Error(`Failed to update rule: ${error.message}`);
      }

      if (!data) {
        throw new Error('Failed to update rule: No data returned');
      }

      return this.transformDatabaseRecord(data);
    } catch (error) {
      console.error('Error updating rule:', error);
      throw error;
    }
  }

  /**
   * Deletes a curation rule
   * 
   * @param ruleId - ID of rule to delete
   * @returns True if deleted successfully
   */
  async deleteRule(ruleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('curation_rules')
        .delete()
        .eq('id', ruleId);

      if (error) {
        console.error('Failed to delete rule:', error);
        throw new Error(`Failed to delete rule: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting rule:', error);
      throw error;
    }
  }

  /**
   * Tests a rule in preview mode without applying it
   * Requirement B4.5: Provide preview mode simulating different age profiles
   * 
   * @param rule - Rule to test
   * @param testContent - Array of content items to test against
   * @param testContext - Scoring context for testing
   * @returns Test results showing how rule affects content
   */
  async testRule(
    rule: Partial<CurationRule>,
    testContent: CuratedContentItem[],
    testContext: ScoringContext
  ): Promise<RuleTestResult> {
    try {
      // Validate the rule first
      const validation = this.validator.validate(rule);
      
      if (!validation.valid) {
        throw new Error(
          `Cannot test invalid rule: ${validation.errors.join(', ')}`
        );
      }

      const testCases = testContent.map(item => {
        // Determine if rule condition matches this content
        const conditionMatches = this.evaluateRuleCondition(
          rule,
          item,
          testContext
        );

        // Calculate expected output based on rule action
        const expectedOutput = conditionMatches
          ? this.applyRuleAction(rule.action!, item, 50) // Use base score of 50
          : { score: 50, applied: false };

        // Calculate actual output (same as expected in preview mode)
        const actualOutput = expectedOutput;

        return {
          input: {
            contentId: item.id,
            contentType: item.type,
            baseScore: 50,
            conditionMatches,
          },
          expectedOutput,
          actualOutput,
          passed: true, // Always true in preview mode
        };
      });

      return {
        ruleId: rule.id || 'preview',
        testCases,
        overallSuccess: true,
      };
    } catch (error) {
      console.error('Error testing rule:', error);
      throw error;
    }
  }

  /**
   * Gets a single rule by ID
   * 
   * @param ruleId - Rule ID
   * @returns Curation rule
   */
  async getRule(ruleId: string): Promise<CurationRule | null> {
    try {
      const { data, error } = await supabase
        .from('curation_rules')
        .select('*')
        .eq('id', ruleId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        console.error('Failed to fetch rule:', error);
        throw new Error(`Failed to fetch rule: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      return this.transformDatabaseRecord(data);
    } catch (error) {
      console.error('Error fetching rule:', error);
      throw error;
    }
  }

  /**
   * Activates a rule
   * 
   * @param ruleId - Rule ID
   * @returns Updated rule
   */
  async activateRule(ruleId: string): Promise<CurationRule> {
    return this.updateRule(ruleId, { isActive: true });
  }

  /**
   * Deactivates a rule
   * 
   * @param ruleId - Rule ID
   * @returns Updated rule
   */
  async deactivateRule(ruleId: string): Promise<CurationRule> {
    return this.updateRule(ruleId, { isActive: false });
  }

  /**
   * Gets rules by priority range
   * 
   * @param cohort - Age cohort
   * @param minPriority - Minimum priority
   * @param maxPriority - Maximum priority
   * @returns Array of rules in priority range
   */
  async getRulesByPriority(
    cohort: AgeCohort,
    minPriority: number,
    maxPriority: number
  ): Promise<CurationRule[]> {
    try {
      const { data, error } = await supabase
        .from('curation_rules')
        .select('*')
        .eq('cohort', cohort)
        .eq('is_active', true)
        .gte('priority', minPriority)
        .lte('priority', maxPriority)
        .order('priority', { ascending: false });

      if (error) {
        console.error('Failed to fetch rules by priority:', error);
        throw new Error(`Failed to fetch rules: ${error.message}`);
      }

      if (!data) {
        return [];
      }

      return data.map(record => this.transformDatabaseRecord(record));
    } catch (error) {
      console.error('Error fetching rules by priority:', error);
      throw error;
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Transforms database record to CurationRule object
   */
  private transformDatabaseRecord(record: any): CurationRule {
    return {
      id: record.id,
      cohort: record.cohort as AgeCohort,
      ruleType: record.rule_type as RuleType,
      condition: record.condition as RuleCondition,
      parameters: record.parameters || {},
      action: record.action as RuleAction,
      priority: record.priority || 0,
      isActive: record.is_active !== false,
      createdBy: record.created_by || 'system',
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }

  /**
   * Evaluates if a rule condition matches content
   */
  private evaluateRuleCondition(
    rule: Partial<CurationRule>,
    item: CuratedContentItem,
    context: ScoringContext
  ): boolean {
    if (!rule.condition || !rule.parameters) {
      return false;
    }

    switch (rule.condition) {
      case 'age_range':
        if (context.user.age) {
          return (
            context.user.age >= rule.parameters.minAge &&
            context.user.age <= rule.parameters.maxAge
          );
        }
        return false;

      case 'content_type':
        return item.type === rule.parameters.contentType;

      case 'location':
        if (rule.parameters.county) {
          return (
            item.metadata?.location?.county === rule.parameters.county
          );
        }
        if (rule.parameters.subCounty) {
          return (
            item.metadata?.location?.subCounty === rule.parameters.subCounty
          );
        }
        return false;

      case 'interest':
        if (context.user.interests) {
          return context.user.interests.includes(rule.parameters.interest);
        }
        return false;

      case 'engagement_history':
        if (rule.parameters.metric && rule.parameters.threshold !== undefined) {
          const metricValue = this.getEngagementMetric(
            context.personalHistory,
            rule.parameters.metric
          );
          return metricValue >= rule.parameters.threshold;
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Applies a rule action to a score
   */
  private applyRuleAction(
    action: RuleAction,
    item: CuratedContentItem,
    baseScore: number
  ): { score: number; applied: boolean; reason: string } {
    switch (action.type) {
      case 'multiply_score':
        return {
          score: baseScore * (action.value as number),
          applied: true,
          reason: action.reason,
        };

      case 'add_score':
        return {
          score: baseScore + (action.value as number),
          applied: true,
          reason: action.reason,
        };

      case 'set_score':
        return {
          score: action.value as number,
          applied: true,
          reason: action.reason,
        };

      case 'exclude':
        return {
          score: 0,
          applied: true,
          reason: action.reason,
        };

      case 'require':
        return {
          score: action.value ? baseScore : 0,
          applied: true,
          reason: action.reason,
        };

      default:
        return {
          score: baseScore,
          applied: false,
          reason: 'Unknown action type',
        };
    }
  }

  /**
   * Gets an engagement metric value from history
   */
  private getEngagementMetric(
    history: any,
    metric: string
  ): number {
    switch (metric) {
      case 'total_interactions':
        return history.totalInteractions || 0;
      case 'engagement_score':
        return history.engagementScore || 0;
      case 'recent_activity_count':
        return history.recentInteractions?.length || 0;
      default:
        return 0;
    }
  }
}

// Export singleton instance
export const curationRulesService = new CurationRulesService();
