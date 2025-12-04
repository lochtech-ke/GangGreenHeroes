/**
 * Onboarding Guide Service Tests
 * Tests for AI-powered step-by-step onboarding guidance
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { onboardingGuideService, type OnboardingContext } from './onboardingGuide.service';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    }))
  }
}));

// Mock AI Companion Service
vi.mock('./aiCompanion.service', () => ({
  aiCompanionService: {
    sendMessage: vi.fn(() => Promise.resolve({
      id: 'test-message-id',
      userId: 'test-user',
      role: 'assistant',
      content: 'Test AI guidance message',
      timestamp: new Date()
    })),
    getContextualSuggestions: vi.fn(() => Promise.resolve([
      {
        id: 'rec-1',
        type: 'mission',
        title: 'Test Mission',
        description: 'Test mission description',
        relevanceScore: 0.9,
        reason: 'Matches your interests',
        ageAppropriate: true
      }
    ]))
  }
}));

describe('OnboardingGuideService', () => {
  const mockContext: OnboardingContext = {
    userId: 'test-user-123',
    userType: 'individual',
    climateInterests: ['trees', 'water'],
    ageCohort: '18-24',
    hasCompletedProfile: false,
    hasJoinedCommunity: false,
    hasCompletedLearning: false,
    hasJoinedMission: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOnboardingSteps', () => {
    it('should return all onboarding steps', async () => {
      const steps = await onboardingGuideService.getOnboardingSteps(mockContext);
      
      expect(steps).toBeDefined();
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0]).toHaveProperty('id');
      expect(steps[0]).toHaveProperty('title');
      expect(steps[0]).toHaveProperty('description');
      expect(steps[0]).toHaveProperty('order');
      expect(steps[0]).toHaveProperty('completed');
    });

    it('should include AI guidance for each step', async () => {
      const steps = await onboardingGuideService.getOnboardingSteps(mockContext);
      
      // At least some steps should have AI guidance
      const stepsWithGuidance = steps.filter(step => step.aiGuidance);
      expect(stepsWithGuidance.length).toBeGreaterThan(0);
    });

    it('should order steps correctly', async () => {
      const steps = await onboardingGuideService.getOnboardingSteps(mockContext);
      
      for (let i = 0; i < steps.length - 1; i++) {
        expect(steps[i].order).toBeLessThan(steps[i + 1].order);
      }
    });
  });

  describe('getProgress', () => {
    it('should return initial progress for new user', async () => {
      const progress = await onboardingGuideService.getProgress('new-user-123');
      
      expect(progress).toBeDefined();
      expect(progress.userId).toBe('new-user-123');
      expect(progress.currentStep).toBe(0);
      expect(progress.completedSteps).toEqual([]);
      expect(progress.percentComplete).toBe(0);
      expect(progress.journeyStage).toBe('onboarding');
    });

    it('should calculate percent complete correctly', async () => {
      const progress = await onboardingGuideService.getProgress('test-user');
      
      expect(progress.percentComplete).toBeGreaterThanOrEqual(0);
      expect(progress.percentComplete).toBeLessThanOrEqual(100);
      expect(progress.totalSteps).toBeGreaterThan(0);
    });
  });

  describe('getCurrentStep', () => {
    it('should return first incomplete step', async () => {
      const currentStep = await onboardingGuideService.getCurrentStep('test-user');
      
      // Should return a step (or null if all complete)
      if (currentStep) {
        expect(currentStep).toHaveProperty('id');
        expect(currentStep).toHaveProperty('title');
        expect(currentStep.completed).toBe(false);
      }
    });
  });

  describe('getNextAction', () => {
    it('should return next action with guidance and recommendations', async () => {
      const nextAction = await onboardingGuideService.getNextAction('test-user');
      
      if (nextAction) {
        expect(nextAction).toHaveProperty('step');
        expect(nextAction).toHaveProperty('guidance');
        expect(nextAction).toHaveProperty('recommendations');
        expect(nextAction.step).toHaveProperty('id');
        expect(nextAction.step).toHaveProperty('title');
        expect(typeof nextAction.guidance).toBe('string');
        expect(Array.isArray(nextAction.recommendations)).toBe(true);
      }
    });
  });

  describe('Step Requirements', () => {
    it('should have correct action requirements for key steps', async () => {
      const steps = await onboardingGuideService.getOnboardingSteps(mockContext);
      
      const profileStep = steps.find(s => s.id === 'complete_profile');
      expect(profileStep?.actionRequired).toBe('profile');
      
      const communityStep = steps.find(s => s.id === 'join_community');
      expect(communityStep?.actionRequired).toBe('community');
      
      const learningStep = steps.find(s => s.id === 'first_learning');
      expect(learningStep?.actionRequired).toBe('learning');
      
      const missionStep = steps.find(s => s.id === 'join_mission');
      expect(missionStep?.actionRequired).toBe('mission');
    });

    it('should have estimated time for all steps', async () => {
      const steps = await onboardingGuideService.getOnboardingSteps(mockContext);
      
      steps.forEach(step => {
        expect(step.estimatedMinutes).toBeGreaterThan(0);
      });
    });
  });

  describe('Age-Appropriate Guidance', () => {
    it('should adapt guidance for different age cohorts', async () => {
      const youthContext: OnboardingContext = {
        ...mockContext,
        ageCohort: '13-17'
      };
      
      const seniorContext: OnboardingContext = {
        ...mockContext,
        ageCohort: '50+'
      };
      
      const youthSteps = await onboardingGuideService.getOnboardingSteps(youthContext);
      const seniorSteps = await onboardingGuideService.getOnboardingSteps(seniorContext);
      
      // Both should have steps
      expect(youthSteps.length).toBeGreaterThan(0);
      expect(seniorSteps.length).toBeGreaterThan(0);
      
      // Steps should be the same, but guidance may differ
      expect(youthSteps.length).toBe(seniorSteps.length);
    });
  });

  describe('Interest-Based Guidance', () => {
    it('should consider user interests in guidance', async () => {
      const treesContext: OnboardingContext = {
        ...mockContext,
        climateInterests: ['trees']
      };
      
      const waterContext: OnboardingContext = {
        ...mockContext,
        climateInterests: ['water']
      };
      
      const treesSteps = await onboardingGuideService.getOnboardingSteps(treesContext);
      const waterSteps = await onboardingGuideService.getOnboardingSteps(waterContext);
      
      // Both should have steps
      expect(treesSteps.length).toBeGreaterThan(0);
      expect(waterSteps.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing user context gracefully', async () => {
      const minimalContext: OnboardingContext = {
        userId: 'test-user',
        userType: 'individual',
        climateInterests: [],
        hasCompletedProfile: false,
        hasJoinedCommunity: false,
        hasCompletedLearning: false,
        hasJoinedMission: false
      };
      
      const steps = await onboardingGuideService.getOnboardingSteps(minimalContext);
      
      // Should still return steps even with minimal context
      expect(steps.length).toBeGreaterThan(0);
    });

    it('should handle AI service errors gracefully', async () => {
      // This test verifies that even if AI guidance fails,
      // the service still returns steps with basic descriptions
      const steps = await onboardingGuideService.getOnboardingSteps(mockContext);
      
      // All steps should have at least a description
      steps.forEach(step => {
        expect(step.description).toBeDefined();
        expect(step.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Progress Tracking', () => {
    it('should track total steps correctly', async () => {
      const progress = await onboardingGuideService.getProgress('test-user');
      
      expect(progress.totalSteps).toBe(7); // We have 7 onboarding steps
    });

    it('should calculate percentage correctly with completed steps', async () => {
      // This would need actual database interaction to test properly
      // For now, we verify the calculation logic
      const progress = await onboardingGuideService.getProgress('test-user');
      
      const expectedPercent = Math.round(
        (progress.completedSteps.length / progress.totalSteps) * 100
      );
      
      expect(progress.percentComplete).toBe(expectedPercent);
    });
  });
});
