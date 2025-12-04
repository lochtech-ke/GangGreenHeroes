# AI Climate Companion (Green Mentor)

This directory contains the implementation of the Green Mentor AI chatbot system for the #GangGreen platform.

## Components

### ChatInterface
The main chat interface component that provides an interactive conversation UI with the AI companion.

**Features:**
- Real-time chat with AI responses
- Message history persistence
- Context-aware conversations
- Age-appropriate responses
- Auto-scrolling message display
- Loading states and error handling

**Usage:**
```tsx
import { ChatInterface } from './components/chatbot';

<ChatInterface 
  context={{
    userInterests: ['trees', 'water'],
    ageCohort: '18-24',
    currentPage: '/dashboard',
    recentActions: ['joined_mission', 'completed_learning']
  }}
/>
```

### RecommendationsPanel
Displays AI-generated personalized recommendations for missions, learning modules, communities, and petitions.

**Features:**
- Age-aware recommendations
- Context-based suggestions
- Relevance scoring
- Refresh functionality
- Click-through tracking

**Usage:**
```tsx
import { RecommendationsPanel } from './components/chatbot';

<RecommendationsPanel
  request={{
    userInterests: ['trees', 'policy'],
    ageCohort: '25-34',
    location: { county: 'Nairobi' },
    limit: 5
  }}
  onRecommendationClick={(rec) => {
    // Navigate to recommendation
    navigate(rec.actionUrl);
  }}
/>
```

### ChatbotWidget
A floating chat button that can be placed anywhere in the application.

**Features:**
- Floating button with notification badge
- Expandable chat window
- Configurable positioning
- Context preservation

**Usage:**
```tsx
import { ChatbotWidget } from './components/chatbot';

<ChatbotWidget 
  position="bottom-right"
  context={{
    userInterests: ['trees'],
    ageCohort: '18-24',
    currentPage: window.location.pathname,
    recentActions: []
  }}
/>
```

### EducationalExplainer
A comprehensive Q&A interface for environmental concept explanations with concept simplification.

**Features:**
- Browse 20+ common environmental concepts
- Ask custom environmental questions
- Age-appropriate explanations
- Kenya-focused examples
- Actionable steps for users
- Related concept suggestions
- Two-tab interface (Concepts/Questions)

**Usage:**
```tsx
import { EducationalExplainer } from './components/chatbot';

<EducationalExplainer
  ageCohort="18-24"
  userInterests={['trees', 'water']}
  onClose={() => setShowExplainer(false)}
/>
```

**Supported Concepts:**
- Carbon Sequestration, Climate Change, Deforestation
- Biodiversity, Renewable Energy, Carbon Credits
- Greenhouse Gases, Sustainable Development, Conservation
- Ecosystem Services, Water Conservation, Waste Management
- Composting, Reforestation, Climate Justice
- Environmental Policy, Green Economy, Circular Economy
- Carbon Footprint, Climate Adaptation

## Service Layer

### AICompanionService
The core service that handles all AI interactions.

**Key Methods:**
- `sendMessage(userId, message, context)` - Send a chat message and get AI response
- `getChatHistory(userId, limit)` - Retrieve chat history
- `getRecommendations(request)` - Get personalized recommendations
- `explainConcept(request)` - Explain environmental concepts in simple language
- `answerQuestion(question, ageCohort, context)` - Answer specific environmental questions
- `getCommonConcepts()` - Get list of common environmental concepts

**Configuration:**
The service requires an OpenAI API key to be set in environment variables:
```
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

## Database Schema

### chat_messages Table
Stores all chat messages between users and the AI companion.

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  role VARCHAR(20) CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  context JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## Features

### Context-Aware Conversations
The AI companion considers:
- User's age cohort for appropriate language and suggestions
- Climate interests (trees, water, waste, policy)
- Current page/location in the app
- Recent actions and journey stage
- Geographic location

### Age-Appropriate Responses
Responses are tailored to different age cohorts:
- **13-17**: Simple language, focus on learning and peer activities
- **18-24**: Engaging tone, social campaigns, digital participation
- **25-34**: Professional opportunities, skilled volunteering
- **35-49**: Leadership roles, corporate partnerships
- **50+**: Legacy projects, mentorship, advisory roles

### Personalized Recommendations
The recommendation engine considers:
- User profile and interests
- Age cohort preferences
- Location for local opportunities
- Recent activity to avoid repetition
- Content curation scores

## Error Handling

The service includes comprehensive error handling:
- Rate limit detection and retry-after headers
- Network error recovery
- API key validation
- Graceful fallbacks for failed recommendations
- User-friendly error messages

## Analytics

The system tracks:
- Chat message counts and session duration
- Topics discussed
- Recommendations provided and clicked
- User feedback on recommendations
- Completion rates for recommended actions

## Future Enhancements

- Voice input/output support
- Multi-language support (Swahili, Kikuyu, etc.)
- Proactive notifications based on user behavior
- Integration with mission verification system
- Sentiment analysis for user satisfaction
- A/B testing for recommendation strategies

## Requirements Validation

This implementation satisfies the following requirements from the V1.0 spec:

- **A2.1**: Personalized cause recommendations based on user interests and age cohort ✓
- **A2.2**: Explains concepts in simple, accessible language ✓
  - Concept simplification with age-appropriate explanations ✓
  - Q&A interface for environmental questions ✓
  - Kenya-focused examples and actionable steps ✓
- **A2.3**: Suggests appropriate onboarding steps, learning modules, or actions ✓
- **A2.4**: Provides context through AI chatbot interface ✓
- **A2.5**: Bases suggestions on user profile, location, age cohort, and past activities ✓
