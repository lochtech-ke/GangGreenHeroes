/**
 * Onboarding Guide Service
 * AI-powered step-by-step guidance for new users
 * Requirement A2.3: WHEN a user needs guidance THEN the Platform SHALL suggest appropriate onboarding steps
 */

import { aiCompanionService } from './aiCompanion.service';
import { supabase } from './supabase';
import type { ChatContext, Recommendation } from '../types/aiCompanion.types';
import type { UserType, ClimateInterest, AgeCohort } from '../types/platform.types';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  order: number;
  completed: boolean;
  aiGuidance?: string;
  actionRequired?: 'profile' | 'interests' | 'age' | 'community' | 'mission' | 'learning';
  estimatedMinutes?: number;
}

export interface OnboardingProgress {
  userId: string;
  currentStep: number;
  completedSteps: string[];
  totalSteps: number;
  percentComplete: number;
  journeyStage: 'onboarding' | 'engagement' | 'contribution' | 'recognition' | 'hero';
}

export interface OnboardingContext {
  userId: string;
  userType: UserType;
  climateInterests: ClimateInterest[];
  ageCohort?: AgeCohort;
  hasCompletedProfile: boolean;
  hasJoinedCommunity: boolean;
  hasCompletedLearning: boolean;
  hasJoinedMission: boolean;
}

class OnboardingGuideService {
  private readonly ONBOARDING_STEPS: Omit<OnboardingStep, 'completed' | 'aiGuidance'>[] = [
    {
      id: 'welcome',
      title: 'Welcome to #GangGreen',
      description: 'Learn about our five pillars of climate action',
      order: 1,
      estimatedMinutes: 2
    },
    {
      id: 'meet_mentor',
      title: 'Meet Your Green Mentor',
      description: 'Get introduced to your AI climate companion',
      order: 2,
      estimatedMinutes: 1
    },
    {
      id: 'complete_profile',
      title: 'Complete Your Profile',
      description: 'Tell us about yourself and your climate interests',
      order: 3,
      actionRequired: 'profile',
      estimatedMinutes: 3
    },
    {
      id: 'explore_dashboard',
      title: 'Explore Your Dashboard',
      description: 'See personalized content and recommendations',
      order: 4,
      estimatedMinutes: 2
    },
    {
      id: 'join_community',
      title: 'Join a Community',
      description: 'Connect with local climate activists',
      order: 5,
      actionRequired: 'community',
      estimatedMinutes: 3
    },
    {
      id: 'first_learning',
      title: 'Complete Your First Lesson',
      description: 'Learn about conservation and earn GG Coins',
      order: 6,
      actionRequired: 'learning',
      estimatedMinutes: 5
    },
    {
      id: 'join_mission',
      title: 'Join Your First Mission',
      description: 'Take real-world climate action',
      order: 7,
      actionRequired: 'mission',
      estimatedMinutes: 2
    }
  ];

  /**
   * Get onboarding steps with AI-generated guidance
   */
  async getOnboardingSteps(context: OnboardingContext): Promise<OnboardingStep[]> {
    try {
      const progress = await this.getProgress(context.userId);
      
      const steps = await Promise.all(
        this.ONBOARDING_STEPS.map(async (step) => {
          const completed = progress.completedSteps.includes(step.id);
          const aiGuidance = await this.generateStepGuidance(step, context);
          
          return {
            ...step,
            completed,
            aiGuidance
          };
        })
      );

      return steps;
    } catch (error) {
      console.error('Error getting onboarding steps:', error);
      // Return steps without AI guidance on error
      return this.ONBOARDING_STEPS.map(step => ({
        ...step,
        completed: false
      }));
    }
  }

  /**
   * Get the current onboarding step for a user
   */
  async getCurrentStep(userId: string): Promise<OnboardingStep | null> {
    try {
      const context = await this.getUserContext(userId);
      const steps = await this.getOnboardingSteps(context);
      
      // Find the first incomplete step
      const currentStep = steps.find(step => !step.completed);
      return currentStep || null;
    } catch (error) {
      console.error('Error getting current step:', error);
      return null;
    }
  }

  /**
   * Get next recommended action with AI guidance
   */
  async getNextAction(userId: string): Promise<{
    step: OnboardingStep;
    guidance: string;
    recommendations: Recommendation[];
  } | null> {
    try {
      const currentStep = await this.getCurrentStep(userId);
      if (!currentStep) return null;

      const context = await this.getUserContext(userId);
      const chatContext: ChatContext = {
        ageCohort: context.ageCohort || '18-24',
        userInterests: context.climateInterests,
        currentPage: 'onboarding',
        journeyStage: 'onboarding',
        recentActions: []
      };

      // Get AI-powered guidance for the current step
      const guidance = await this.getDetailedGuidance(currentStep, context);

      // Get relevant recommendations based on the step
      const recommendations = await this.getStepRecommendations(currentStep, context, chatContext);

      return {
        step: currentStep,
        guidance,
        recommendations
      };
    } catch (error) {
      console.error('Error getting next action:', error);
      return null;
    }
  }

  /**
   * Mark a step as completed
   */
  async completeStep(userId: string, stepId: string): Promise<void> {
    try {
      const progress = await this.getProgress(userId);
      
      if (!progress.completedSteps.includes(stepId)) {
        const updatedSteps = [...progress.completedSteps, stepId];
        
        await supabase
          .from('user_onboarding_progress')
          .upsert({
            user_id: userId,
            completed_steps: updatedSteps,
            current_step: progress.currentStep + 1,
            updated_at: new Date().toISOString()
          });

        // Check if onboarding is complete
        if (updatedSteps.length === this.ONBOARDING_STEPS.length) {
          await this.completeOnboarding(userId);
        }
      }
    } catch (error) {
      console.error('Error completing step:', error);
      throw error;
    }
  }

  /**
   * Get user's onboarding progress
   */
  async getProgress(userId: string): Promise<OnboardingProgress> {
    try {
      const { data, error } = await supabase
        .from('user_onboarding_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is ok
        throw error;
      }

      const completedSteps = data?.completed_steps || [];
      const totalSteps = this.ONBOARDING_STEPS.length;
      const percentComplete = Math.round((completedSteps.length / totalSteps) * 100);

      return {
        userId,
        currentStep: data?.current_step || 0,
        completedSteps,
        totalSteps,
        percentComplete,
        journeyStage: data?.journey_stage || 'onboarding'
      };
    } catch (error) {
      console.error('Error getting progress:', error);
      return {
        userId,
        currentStep: 0,
        completedSteps: [],
        totalSteps: this.ONBOARDING_STEPS.length,
        percentComplete: 0,
        journeyStage: 'onboarding'
      };
    }
  }

  /**
   * Reset onboarding progress (for testing or re-onboarding)
   */
  async resetProgress(userId: string): Promise<void> {
    try {
      await supabase
        .from('user_onboarding_progress')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error resetting progress:', error);
      throw error;
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Generate AI guidance for a specific step
   */
  private async generateStepGuidance(
    step: Omit<OnboardingStep, 'completed' | 'aiGuidance'>,
    context: OnboardingContext
  ): Promise<string> {
    try {
      const prompt = this.buildGuidancePrompt(step, context);
      
      const message = await aiCompanionService.sendMessage(
        context.userId,
        prompt,
        {
          ageCohort: context.ageCohort || '18-24',
          userInterests: context.climateInterests,
          currentPage: 'onboarding',
          journeyStage: 'onboarding',
          recentActions: []
        }
      );

      return message.content;
    } catch (error) {
      console.error('Error generating step guidance:', error);
      return step.description;
    }
  }

  /**
   * Get detailed guidance for the current step
   */
  private async getDetailedGuidance(
    step: OnboardingStep,
    context: OnboardingContext
  ): Promise<string> {
    const prompt = `I'm on the "${step.title}" step of onboarding. ${step.description}. 
Can you give me specific, actionable guidance on what to do next? Keep it brief and encouraging.`;

    try {
      const message = await aiCompanionService.sendMessage(
        context.userId,
        prompt,
        {
          ageCohort: context.ageCohort || '18-24',
          userInterests: context.climateInterests,
          currentPage: 'onboarding',
          journeyStage: 'onboarding',
          recentActions: []
        }
      );

      return message.content;
    } catch (error) {
      console.error('Error getting detailed guidance:', error);
      return step.description;
    }
  }

  /**
   * Get recommendations relevant to the current step
   */
  private async getStepRecommendations(
    step: OnboardingStep,
    context: OnboardingContext,
    chatContext: ChatContext
  ): Promise<Recommendation[]> {
    try {
      // Map step action to recommendation types
      const typeMap: Record<string, ('mission' | 'learning' | 'community' | 'petition' | 'action')[]> = {
        'community': ['community'],
        'learning': ['learning'],
        'mission': ['mission'],
        'default': ['mission', 'learning', 'community', 'action']
      };

      const types = step.actionRequired 
        ? typeMap[step.actionRequired] || typeMap.default
        : typeMap.default;

      const recommendations = await aiCompanionService.getContextualSuggestions(
        context.userId,
        chatContext
      );

      // Filter recommendations by relevant types
      return recommendations.filter(rec => types.includes(rec.type));
    } catch (error) {
      console.error('Error getting step recommendations:', error);
      return [];
    }
  }

  /**
   * Build a prompt for generating step guidance
   */
  private buildGuidancePrompt(
    step: Omit<OnboardingStep, 'completed' | 'aiGuidance'>,
    context: OnboardingContext
  ): string {
    let prompt = `Provide brief, encouraging guidance for the onboarding step: "${step.title}". `;
    prompt += `Description: ${step.description}. `;
    
    if (context.ageCohort) {
      prompt += `The user is in the ${context.ageCohort} age group. `;
    }
    
    if (context.climateInterests.length > 0) {
      prompt += `Their interests include: ${context.climateInterests.join(', ')}. `;
    }

    prompt += `Keep the guidance under 100 words, actionable, and age-appropriate.`;

    return prompt;
  }

  /**
   * Get user context for onboarding
   */
  private async getUserContext(userId: string): Promise<OnboardingContext> {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*, users!inner(*)')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      // Get climate interests
      const { data: interests } = await supabase
        .from('user_climate_interests')
        .select('interest')
        .eq('user_id', userId);

      // Check completion status
      const { data: communities } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', userId)
        .limit(1);

      const { data: learning } = await supabase
        .from('user_learning_progress')
        .select('module_id')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .limit(1);

      const { data: missions } = await supabase
        .from('mission_participations')
        .select('mission_id')
        .eq('user_id', userId)
        .limit(1);

      return {
        userId,
        userType: profile.users.user_type || 'individual',
        climateInterests: interests?.map(i => i.interest) || [],
        ageCohort: profile.age_cohort,
        hasCompletedProfile: !!(profile.full_name && interests && interests.length > 0),
        hasJoinedCommunity: !!(communities && communities.length > 0),
        hasCompletedLearning: !!(learning && learning.length > 0),
        hasJoinedMission: !!(missions && missions.length > 0)
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return {
        userId,
        userType: 'individual',
        climateInterests: [],
        hasCompletedProfile: false,
        hasJoinedCommunity: false,
        hasCompletedLearning: false,
        hasJoinedMission: false
      };
    }
  }

  /**
   * Mark onboarding as complete and transition to engagement stage
   */
  private async completeOnboarding(userId: string): Promise<void> {
    try {
      // Update user journey stage
      await supabase
        .from('users')
        .update({ journey_stage: 'engagement' })
        .eq('id', userId);

      // Update onboarding progress
      await supabase
        .from('user_onboarding_progress')
        .update({
          journey_stage: 'engagement',
          completed_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      console.log('Onboarding completed for user:', userId);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  }
}

export const onboardingGuideService = new OnboardingGuideService();
