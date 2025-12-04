/**
 * Content Filtering Engine Service
 * 
 * Implements age-based content filtering to ensure users only see
 * age-appropriate content based on their cohort.
 * 
 * Requirements: B1.3, B1.5, B2.3, B3.3
 */

import {
  AgeCohort,
  CuratedContentItem,
  AgeRange,
} from '../types/contentCuration.types';

// ============================================================================
// Content Metadata Interfaces
// ============================================================================

/**
 * Extended content item with filtering metadata
 */
export interface FilterableContentItem extends CuratedContentItem {
  metadata: {
    requiresFinancialContribution?: boolean;
    financialRequirement?: {
      amount?: number;
      currency?: string;
      type?: 'donation' | 'purchase' | 'investment' | 'fee';
    };
    requiresAdultStatus?: boolean;
    requiresLegalAge?: boolean;
    physicalIntensity?: 'low' | 'medium' | 'high';
    participationType?: 'digital' | 'physical' | 'hybrid' | 'remote';
    professionalSkillsRequired?: string[];
    carbonCreditAvailable?: boolean;
    legacyProject?: boolean;
    advisoryRole?: boolean;
    mentorshipOpportunity?: boolean;
    [key: string]: any;
  };
}

/**
 * Filter result with reasons for inclusion/exclusion
 */
export interface FilterResult {
  item: FilterableContentItem;
  included: boolean;
  reasons: string[];
  filtersPassed: string[];
  filtersFailed: string[];
}

/**
 * Batch filter result
 */
export interface BatchFilterResult {
  filtered: FilterableContentItem[];
  excluded: FilterableContentItem[];
  totalProcessed: number;
  filterStats: {
    cohort: AgeCohort;
    totalItems: number;
    includedItems: number;
    excludedItems: number;
    filterBreakdown: Record<string, number>;
  };
}

// ============================================================================
// Content Filtering Engine
// ============================================================================

export class ContentFilteringEngine {
  /**
   * Filters content items based on age cohort restrictions
   * 
   * @param items - Content items to filter
   * @param cohort - User's age cohort
   * @returns Filtered content items
   */
  filterByAgeCohort(
    items: FilterableContentItem[],
    cohort: AgeCohort
  ): FilterableContentItem[] {
    return items.filter(item => this.isContentAppropriate(item, cohort));
  }

  /**
   * Filters content with detailed results
   * 
   * @param items - Content items to filter
   * @param cohort - User's age cohort
   * @returns Detailed filter results
   */
  filterWithDetails(
    items: FilterableContentItem[],
    cohort: AgeCohort
  ): BatchFilterResult {
    const results: FilterResult[] = items.map(item => 
      this.evaluateContent(item, cohort)
    );

    const filtered = results
      .filter(r => r.included)
      .map(r => r.item);

    const excluded = results
      .filter(r => !r.included)
      .map(r => r.item);

    // Calculate filter statistics
    const filterBreakdown: Record<string, number> = {};
    results.forEach(result => {
      result.filtersFailed.forEach(filter => {
        filterBreakdown[filter] = (filterBreakdown[filter] || 0) + 1;
      });
    });

    return {
      filtered,
      excluded,
      totalProcessed: items.length,
      filterStats: {
        cohort,
        totalItems: items.length,
        includedItems: filtered.length,
        excludedItems: excluded.length,
        filterBreakdown,
      },
    };
  }

  /**
   * Evaluates a single content item against cohort filters
   * 
   * @param item - Content item to evaluate
   * @param cohort - User's age cohort
   * @returns Filter result with reasons
   */
  private evaluateContent(
    item: FilterableContentItem,
    cohort: AgeCohort
  ): FilterResult {
    const filtersPassed: string[] = [];
    const filtersFailed: string[] = [];
    const reasons: string[] = [];

    // Check age targeting restrictions
    if (!this.passesAgeTargeting(item, cohort)) {
      filtersFailed.push('age_targeting');
      reasons.push('Content is not targeted for this age cohort');
    } else {
      filtersPassed.push('age_targeting');
    }

    // Apply cohort-specific filters
    switch (cohort) {
      case '13-17':
        this.applyMinorFilters(item, filtersPassed, filtersFailed, reasons);
        break;
      case '18-24':
        this.applyYouthFilters(item, filtersPassed, filtersFailed, reasons);
        break;
      case '25-34':
      case '35-49':
        this.applyProfessionalFilters(item, filtersPassed, filtersFailed, reasons);
        break;
      case '50+':
        this.applySeniorFilters(item, filtersPassed, filtersFailed, reasons);
        break;
    }

    const included = filtersFailed.length === 0;

    return {
      item,
      included,
      reasons,
      filtersPassed,
      filtersFailed,
    };
  }

  /**
   * Checks if content is appropriate for the given cohort
   * 
   * @param item - Content item
   * @param cohort - Age cohort
   * @returns True if content is appropriate
   */
  private isContentAppropriate(
    item: FilterableContentItem,
    cohort: AgeCohort
  ): boolean {
    // Check age targeting
    if (!this.passesAgeTargeting(item, cohort)) {
      return false;
    }

    // Apply cohort-specific filters
    switch (cohort) {
      case '13-17':
        return this.isAppropriateForMinors(item);
      case '18-24':
        return this.isAppropriateForYouth(item);
      case '25-34':
      case '35-49':
        return this.isAppropriateForProfessionals(item);
      case '50+':
        return this.isAppropriateForSeniors(item);
      default:
        return true;
    }
  }

  /**
   * Checks if content passes age targeting restrictions
   * 
   * @param item - Content item
   * @param cohort - Age cohort
   * @returns True if content is targeted for this cohort
   */
  private passesAgeTargeting(
    item: FilterableContentItem,
    cohort: AgeCohort
  ): boolean {
    // If no age targeting specified, content is available to all
    if (!item.ageTargeting || item.ageTargeting.length === 0) {
      return true;
    }

    // Get age range for cohort
    const cohortAgeRange = this.getCohortAgeRange(cohort);

    // Check if any age targeting range overlaps with cohort range
    return item.ageTargeting.some(range => 
      this.rangesOverlap(range, cohortAgeRange)
    );
  }

  /**
   * Gets the age range for a cohort
   * 
   * @param cohort - Age cohort
   * @returns Age range
   */
  private getCohortAgeRange(cohort: AgeCohort): AgeRange {
    switch (cohort) {
      case '13-17':
        return { minAge: 13, maxAge: 17 };
      case '18-24':
        return { minAge: 18, maxAge: 24 };
      case '25-34':
        return { minAge: 25, maxAge: 34 };
      case '35-49':
        return { minAge: 35, maxAge: 49 };
      case '50+':
        return { minAge: 50, maxAge: 120 };
    }
  }

  /**
   * Checks if two age ranges overlap
   * 
   * @param range1 - First age range
   * @param range2 - Second age range
   * @returns True if ranges overlap
   */
  private rangesOverlap(range1: AgeRange, range2: AgeRange): boolean {
    return range1.minAge <= range2.maxAge && range2.minAge <= range1.maxAge;
  }

  // ============================================================================
  // Minor Filters (13-17) - Requirements B1.3, B1.5
  // ============================================================================

  /**
   * Applies filters for minors (13-17)
   * Requirement B1.3: Filter out content requiring financial contributions above youth capacity
   * Requirement B1.5: Exclude content requiring legal adult status or financial transactions
   */
  private applyMinorFilters(
    item: FilterableContentItem,
    passed: string[],
    failed: string[],
    reasons: string[]
  ): void {
    // B1.5: Exclude content requiring adult status
    if (item.metadata.requiresAdultStatus || item.metadata.requiresLegalAge) {
      failed.push('requires_adult_status');
      reasons.push('Content requires legal adult status');
      return;
    } else {
      passed.push('adult_status_check');
    }

    // B1.3 & B1.5: Exclude content requiring financial contributions
    if (item.metadata.requiresFinancialContribution) {
      failed.push('requires_financial_contribution');
      reasons.push('Content requires financial contribution not suitable for minors');
      return;
    } else {
      passed.push('financial_contribution_check');
    }

    // Additional safety check for financial transactions
    if (item.metadata.financialRequirement) {
      failed.push('has_financial_requirement');
      reasons.push('Content has financial requirements');
      return;
    } else {
      passed.push('financial_requirement_check');
    }
  }

  /**
   * Checks if content is appropriate for minors (13-17)
   */
  private isAppropriateForMinors(item: FilterableContentItem): boolean {
    // Exclude adult-only content
    if (item.metadata.requiresAdultStatus || item.metadata.requiresLegalAge) {
      return false;
    }

    // Exclude content with financial requirements
    if (item.metadata.requiresFinancialContribution || item.metadata.financialRequirement) {
      return false;
    }

    return true;
  }

  // ============================================================================
  // Youth Filters (18-24) - Requirement B1.3
  // ============================================================================

  /**
   * Applies filters for youth (18-24)
   * Requirement B1.3: Filter out content requiring financial contributions above youth capacity
   */
  private applyYouthFilters(
    item: FilterableContentItem,
    passed: string[],
    failed: string[],
    reasons: string[]
  ): void {
    // B1.3: Filter high financial requirements
    if (item.metadata.financialRequirement) {
      const requirement = item.metadata.financialRequirement;
      
      // Define youth capacity threshold (e.g., 5000 KES or equivalent)
      const youthCapacityThreshold = 5000;
      
      if (requirement.amount && requirement.amount > youthCapacityThreshold) {
        failed.push('high_financial_requirement');
        reasons.push(`Financial requirement (${requirement.amount} ${requirement.currency || 'KES'}) exceeds youth capacity`);
        return;
      }
    }

    passed.push('youth_financial_check');
  }

  /**
   * Checks if content is appropriate for youth (18-24)
   */
  private isAppropriateForYouth(item: FilterableContentItem): boolean {
    // Filter high financial requirements
    if (item.metadata.financialRequirement) {
      const requirement = item.metadata.financialRequirement;
      const youthCapacityThreshold = 5000;
      
      if (requirement.amount && requirement.amount > youthCapacityThreshold) {
        return false;
      }
    }

    return true;
  }

  // ============================================================================
  // Professional Filters (25-49) - Requirement B2.3
  // ============================================================================

  /**
   * Applies filters for professionals (25-49)
   * Requirement B2.3: Include carbon credit investment opportunities
   * 
   * Note: This is an inclusion filter, not an exclusion filter.
   * We boost content with professional features but don't exclude others.
   */
  private applyProfessionalFilters(
    _item: FilterableContentItem,
    passed: string[],
    _failed: string[],
    _reasons: string[]
  ): void {
    // B2.3: Professional content is always appropriate
    // No exclusion filters for this cohort
    passed.push('professional_content_check');

    // Note: Boosting of professional content (carbon credits, donations, etc.)
    // is handled by the scoring engine, not the filtering engine
  }

  /**
   * Checks if content is appropriate for professionals (25-49)
   */
  private isAppropriateForProfessionals(_item: FilterableContentItem): boolean {
    // No exclusion filters for professionals
    return true;
  }

  // ============================================================================
  // Senior Filters (50+) - Requirement B3.3
  // ============================================================================

  /**
   * Applies filters for seniors (50+)
   * Requirement B3.3: Include educational content about long-term environmental impact
   * 
   * Note: This is an inclusion filter, not an exclusion filter.
   * We boost content with senior-appropriate features but don't exclude others.
   */
  private applySeniorFilters(
    _item: FilterableContentItem,
    passed: string[],
    _failed: string[],
    _reasons: string[]
  ): void {
    // B3.3: Senior content is always appropriate
    // No exclusion filters for this cohort
    passed.push('senior_content_check');

    // Note: Boosting of senior content (legacy projects, advisory roles, etc.)
    // is handled by the scoring engine, not the filtering engine
  }

  /**
   * Checks if content is appropriate for seniors (50+)
   */
  private isAppropriateForSeniors(_item: FilterableContentItem): boolean {
    // No exclusion filters for seniors
    return true;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Gets filter statistics for a cohort
   * 
   * @param items - Content items
   * @param cohort - Age cohort
   * @returns Filter statistics
   */
  getFilterStatistics(
    items: FilterableContentItem[],
    cohort: AgeCohort
  ): {
    totalItems: number;
    filteredItems: number;
    excludedItems: number;
    exclusionReasons: Record<string, number>;
  } {
    const result = this.filterWithDetails(items, cohort);
    
    return {
      totalItems: result.totalProcessed,
      filteredItems: result.filtered.length,
      excludedItems: result.excluded.length,
      exclusionReasons: result.filterStats.filterBreakdown,
    };
  }

  /**
   * Validates content metadata for filtering
   * 
   * @param item - Content item
   * @returns Validation result
   */
  validateContentMetadata(item: FilterableContentItem): {
    valid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    // Check for conflicting metadata
    if (item.metadata.requiresAdultStatus && item.ageTargeting) {
      const hasMinorTargeting = item.ageTargeting.some(
        range => range.minAge < 18
      );
      if (hasMinorTargeting) {
        warnings.push('Content requires adult status but targets minors');
      }
    }

    // Check for missing financial details
    if (item.metadata.requiresFinancialContribution && !item.metadata.financialRequirement) {
      warnings.push('Content requires financial contribution but lacks details');
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }
}

// Export singleton instance
export const contentFilteringEngine = new ContentFilteringEngine();
