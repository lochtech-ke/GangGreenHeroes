# Onboarding Guide Implementation

## Overview

The AI-powered onboarding guide provides step-by-step guidance for new users as they begin their climate action journey on the #GangGreen platform. This implementation fulfills **Requirement A2.3**: "WHEN a user needs guidance THEN the Platform SHALL suggest appropriate onboarding steps, learning modules, or actions."

## Architecture

### Components

1. **OnboardingGuideService** (`src/services/onboardingGuide.service.ts`)
   - Core service managing onboarding flow
   - Tracks user progress through onboarding steps
   - Generates AI-powered guidance for each step
   - Provides contextual recommendations

2. **OnboardingGuidePanel** (`src/components/auth/OnboardingGuidePanel.tsx`)
   - UI component displaying current step and guidance
   - Shows progress bar and completion status
   - Displays AI-generated guidance from Green Mentor
   - Shows relevant recommendations for each step

3. **OnboardingGuidePage** (`src/pages/OnboardingGuidePage.tsx`)
   - Full-page onboarding experience
   - Shows all steps overview in sidebar
   - Integrates with dashboard navigation

4. **OnboardingWizard** (`src/components/auth/OnboardingWizard.tsx`)
   - Enhanced with onboarding guide integration
   - Marks initial steps as complete
   - Transitions to guided onboarding flow

## Onboarding Steps

The onboarding journey consists of 7 steps:

1. **Welcome** (2 min)
   - Introduction to five pillars of climate action
   - Interactive welcome video

2. **Meet Your Green Mentor** (1 min)
   - Introduction to AI climate companion
   - Overview of AI capabilities

3. **Complete Your Profile** (3 min)
   - User type selection
   - Climate interests
   - Age/date of birth (optional)
   - Action Required: Profile completion

4. **Explore Your Dashboard** (2 min)
   - Personalized content overview
   - Age-curated recommendations

5. **Join a Community** (3 min)
   - Browse local communities
   - Connect with climate activists
   - Action Required: Join at least one community

6. **Complete Your First Lesson** (5 min)
   - Access learning modules
   - Earn first Green Coins
   - Action Required: Complete one lesson

7. **Join Your First Mission** (2 min)
   - Browse available missions
   - Take real-world climate action
   - Action Required: Join one mission

## AI-Powered Guidance

### How It Works

1. **Context-Aware**: The AI considers:
   - User's age cohort
   - Climate interests
   - Current page/location
   - Journey stage
   - Recent actions

2. **Personalized Recommendations**: For each step, the system:
   - Generates age-appropriate guidance
   - Suggests relevant missions, communities, or learning modules
   - Explains why recommendations are relevant

3. **Adaptive Flow**: The guide adapts based on:
   - User's completion status
   - Profile completeness
   - Engagement patterns

### Example AI Guidance

For a 16-year-old interested in trees:

```
Step: Join Your First Mission

Green Mentor says:
"Great job completing your first lesson! Now it's time to take action. 
I recommend starting with a tree planting mission in your area. 
Look for missions marked 'Youth-Friendly' - they're designed for 
students like you and often happen on weekends. You'll meet other 
young climate activists and earn Green Coins for your participation!"

Recommended for you:
- Karura Forest Tree Planting (Youth-Friendly, Saturday 9am)
- School Green Clubs Initiative (Ongoing, Flexible timing)
- Kakamega Forest Conservation (Weekend trips available)
```

## Database Schema

### user_onboarding_progress

```sql
CREATE TABLE user_onboarding_progress (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  current_step INTEGER DEFAULT 0,
  completed_steps TEXT[],
  journey_stage VARCHAR(20) DEFAULT 'onboarding',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Methods

### OnboardingGuideService

```typescript
// Get all onboarding steps with AI guidance
async getOnboardingSteps(context: OnboardingContext): Promise<OnboardingStep[]>

// Get current step for user
async getCurrentStep(userId: string): Promise<OnboardingStep | null>

// Get next recommended action with guidance
async getNextAction(userId: string): Promise<{
  step: OnboardingStep;
  guidance: string;
  recommendations: Recommendation[];
} | null>

// Mark step as completed
async completeStep(userId: string, stepId: string): Promise<void>

// Get user's progress
async getProgress(userId: string): Promise<OnboardingProgress>

// Reset progress (for testing)
async resetProgress(userId: string): Promise<void>
```

## Integration Points

### 1. Registration Flow

After user completes registration:
```typescript
// In RegisterPage.tsx
const handleRegistrationComplete = async () => {
  // Mark initial steps as complete
  await onboardingGuideService.completeStep(userId, 'welcome');
  await onboardingGuideService.completeStep(userId, 'meet_mentor');
  
  // Redirect to onboarding guide
  navigate('/onboarding-guide');
};
```

### 2. Dashboard Integration

Show onboarding progress in dashboard:
```typescript
// In DashboardPage.tsx
const progress = await onboardingGuideService.getProgress(userId);

if (progress.percentComplete < 100) {
  // Show onboarding widget
  const nextAction = await onboardingGuideService.getNextAction(userId);
  // Display next step suggestion
}
```

### 3. AI Companion Integration

The onboarding guide uses the AI Companion Service:
```typescript
// Generate step-specific guidance
const message = await aiCompanionService.sendMessage(
  userId,
  `Provide guidance for: ${step.title}`,
  chatContext
);

// Get contextual recommendations
const recommendations = await aiCompanionService.getContextualSuggestions(
  userId,
  chatContext
);
```

## User Experience Flow

```
Registration Complete
       ↓
Welcome Video (Auto-play or Skip)
       ↓
Meet Green Mentor (Introduction)
       ↓
Complete Profile (Required fields)
       ↓
[Onboarding Guide Page]
       ↓
Explore Dashboard → Join Community → First Lesson → First Mission
       ↓
Onboarding Complete → Journey Stage: Engagement
```

## Progress Tracking

### Visual Indicators

1. **Progress Bar**: Shows overall completion percentage
2. **Step Numbers**: Numbered circles (1-7) with checkmarks when complete
3. **Current Step Highlight**: Active step shown with detailed guidance
4. **Estimated Time**: Each step shows estimated completion time

### Completion Criteria

- **Profile**: Name + at least one climate interest
- **Community**: Join at least one community
- **Learning**: Complete at least one lesson
- **Mission**: Join at least one mission

## Testing

### Manual Testing

1. Create new user account
2. Complete registration
3. Verify welcome video displays
4. Check Green Mentor introduction
5. Complete profile with interests
6. Verify AI guidance appears for each step
7. Complete each action requirement
8. Verify progress updates correctly
9. Confirm journey stage transitions to "engagement"

### Automated Testing

```typescript
// Test onboarding flow
describe('OnboardingGuideService', () => {
  it('should track progress through steps', async () => {
    const userId = 'test-user-id';
    
    // Complete first step
    await onboardingGuideService.completeStep(userId, 'welcome');
    
    // Check progress
    const progress = await onboardingGuideService.getProgress(userId);
    expect(progress.completedSteps).toContain('welcome');
    expect(progress.percentComplete).toBeGreaterThan(0);
  });

  it('should generate AI guidance for steps', async () => {
    const context = {
      userId: 'test-user',
      userType: 'individual',
      climateInterests: ['trees'],
      ageCohort: '18-24'
    };
    
    const steps = await onboardingGuideService.getOnboardingSteps(context);
    expect(steps[0].aiGuidance).toBeDefined();
  });
});
```

## Configuration

### Environment Variables

```env
# Required for AI guidance
VITE_OPENAI_API_KEY=your_openai_api_key

# Supabase (for progress tracking)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### Customization

To modify onboarding steps, edit `ONBOARDING_STEPS` in `onboardingGuide.service.ts`:

```typescript
private readonly ONBOARDING_STEPS = [
  {
    id: 'custom_step',
    title: 'Custom Step Title',
    description: 'Step description',
    order: 8,
    actionRequired: 'custom_action',
    estimatedMinutes: 5
  }
];
```

## Performance Considerations

1. **AI Guidance Caching**: Guidance is generated once per step and cached
2. **Lazy Loading**: Recommendations loaded on-demand
3. **Progress Persistence**: Progress saved to database after each step
4. **Async Operations**: All AI calls are non-blocking

## Future Enhancements

1. **Video Tutorials**: Add video guidance for each step
2. **Interactive Tours**: Highlight UI elements during guidance
3. **Gamification**: Award badges for completing onboarding
4. **Social Proof**: Show how many users completed each step
5. **A/B Testing**: Test different guidance approaches
6. **Multi-language**: Support for Swahili and other languages
7. **Offline Mode**: Cache guidance for offline access

## Related Documentation

- [AI Companion Implementation](./AI_COMPANION_IMPLEMENTATION.md)
- [Recommendation Engine](./RECOMMENDATION_ENGINE_IMPLEMENTATION.md)
- [Platform Vision Requirements](./.kiro/specs/v1-major-release/requirements.md)
- [Design Document](./.kiro/specs/v1-major-release/design.md)

## Support

For issues or questions about the onboarding guide:
1. Check the console for error messages
2. Verify OpenAI API key is configured
3. Ensure user has completed registration
4. Check database for onboarding progress records
5. Review AI Companion service logs
