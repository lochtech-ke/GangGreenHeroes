import type {
  MatchResult,
  ConversationContext,
  GeneratedResponse,
  QuickAction,
} from '../../types/chatbot.types';

/**
 * ResponseGenerator
 * Formats and personalizes chatbot responses
 */
class ResponseGenerator {
  /**
   * Generate a response from a match result
   */
  generate(
    matchResult: MatchResult,
    context: ConversationContext
  ): GeneratedResponse {
    let text = matchResult.entry.answer;

    // Personalize the response
    text = this.personalize(text, context);

    // Generate follow-up actions
    const followUpActions = this.generateFollowUpActions(matchResult, context);

    // Get related questions
    const relatedQuestions = matchResult.entry.relatedQuestions || [];

    return {
      text,
      confidence: matchResult.confidence,
      followUpActions,
      relatedQuestions,
      metadata: {
        sourceQuestion: matchResult.entry.question,
        personalized: context.userId !== undefined,
      },
    };
  }

  /**
   * Personalize response based on context
   */
  personalize(response: string, context: ConversationContext): string {
    let personalizedResponse = response;

    // Add user type specific information
    if (context.userType === 'corporate') {
      personalizedResponse = this.addCorporateContext(personalizedResponse);
    } else if (context.userType === 'partner') {
      personalizedResponse = this.addPartnerContext(personalizedResponse);
    }

    // Add contextual greeting for first message
    if (context.messageHistory.length === 0) {
      personalizedResponse = `👋 ${personalizedResponse}`;
    }

    return personalizedResponse;
  }

  /**
   * Add follow-up suggestions
   */
  addFollowUps(
    response: GeneratedResponse,
    _context: ConversationContext
  ): GeneratedResponse {
    // Already generated in the generate() method
    return response;
  }

  /**
   * Generate a greeting response
   */
  generateGreeting(context: ConversationContext): string {
    const greetings = [
      'Hello! 👋 Welcome to Gang Green. How can I help you today?',
      'Hi there! 🌳 I\'m here to help you with Gang Green. What would you like to know?',
      'Welcome! I\'m your Gang Green assistant. Feel free to ask me anything about our platform.',
    ];

    const greeting = greetings[Math.floor(Math.random() * greetings.length)];

    // Add personalization if user is known
    if (context.userId) {
      return greeting.replace('Hello!', 'Hello again!').replace('Hi there!', 'Welcome back!');
    }

    return greeting;
  }

  /**
   * Generate a farewell response
   */
  generateFarewell(): string {
    const farewells = [
      'Thank you for chatting with me! Feel free to come back anytime you have questions. 🌳',
      'Goodbye! Keep making a positive impact with Gang Green. See you soon! 👋',
      'Thanks for your time! Don\'t hesitate to reach out if you need more help. 🌿',
    ];

    return farewells[Math.floor(Math.random() * farewells.length)];
  }

  /**
   * Generate a fallback response when no match is found
   */
  generateFallback(query: string): string {
    return `I'm not sure I understand your question about "${query}". Could you rephrase it, or would you like me to connect you with our support team?`;
  }

  /**
   * Generate a low confidence response
   */
  generateLowConfidenceResponse(matchResult: MatchResult): string {
    return `I'm not entirely sure, but here's what I found:\n\n${matchResult.entry.answer}\n\n💡 If this doesn't answer your question, I can connect you with our support team for more help.`;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Add corporate-specific context
   */
  private addCorporateContext(response: string): string {
    // Add mentions of corporate features where relevant
    if (response.includes('sponsorship') || response.includes('organization')) {
      return `${response}\n\n💼 As a corporate user, you also have access to employee engagement tools and advanced reporting features.`;
    }
    return response;
  }

  /**
   * Add partner-specific context
   */
  private addPartnerContext(response: string): string {
    // Add mentions of partner benefits where relevant
    if (response.includes('partnership') || response.includes('collaborate')) {
      return `${response}\n\n🤝 As a partner, you have access to co-branding opportunities and priority support.`;
    }
    return response;
  }

  /**
   * Generate follow-up action buttons
   */
  private generateFollowUpActions(
    matchResult: MatchResult,
    _context: ConversationContext
  ): QuickAction[] {
    const actions: QuickAction[] = [];
    const category = matchResult.entry.category;

    // Generate actions based on category
    switch (category) {
      case 'getting-started':
        actions.push(
          {
            id: 'action-register',
            label: 'How to Register',
            query: 'How do I sign up?',
            category: 'getting-started',
          },
          {
            id: 'action-forests',
            label: 'About Our Forests',
            query: 'Which forests can I support?',
            category: 'getting-started',
          }
        );
        break;

      case 'projects':
        actions.push(
          {
            id: 'action-find-projects',
            label: 'Find Projects',
            query: 'How do I find projects?',
            category: 'projects',
          },
          {
            id: 'action-join-project',
            label: 'Join a Project',
            query: 'How do I join a project?',
            category: 'projects',
          }
        );
        break;

      case 'education':
        actions.push(
          {
            id: 'action-gamification',
            label: 'About Gamification',
            query: 'What gamification features are available?',
            category: 'education',
          },
          {
            id: 'action-gg-coins',
            label: 'GG Coins',
            query: 'What are GG Coins?',
            category: 'education',
          }
        );
        break;

      case 'community':
        actions.push(
          {
            id: 'action-join-community',
            label: 'Join Community',
            query: 'How do I join a community?',
            category: 'community',
          },
          {
            id: 'action-spread-awareness',
            label: 'Spread Awareness',
            query: 'How can I engage others?',
            category: 'community',
          }
        );
        break;

      case 'verification':
        actions.push(
          {
            id: 'action-verification',
            label: 'Impact Verification',
            query: 'How is impact verified?',
            category: 'verification',
          },
          {
            id: 'action-reports',
            label: 'View Reports',
            query: 'How do I access reports?',
            category: 'verification',
          }
        );
        break;

      case 'sponsorship':
        actions.push(
          {
            id: 'action-sponsor-tiers',
            label: 'Sponsorship Tiers',
            query: 'What sponsorship tiers are available?',
            category: 'sponsorship',
          },
          {
            id: 'action-employee-engagement',
            label: 'Employee Engagement',
            query: 'How can companies engage employees?',
            category: 'sponsorship',
          }
        );
        break;

      case 'support':
        actions.push(
          {
            id: 'action-contact-support',
            label: 'Contact Support',
            query: 'How do I contact support?',
            category: 'support',
          },
          {
            id: 'action-report-bug',
            label: 'Report a Bug',
            query: 'How do I report a bug?',
            category: 'support',
          }
        );
        break;

      default:
        // Default actions
        actions.push(
          {
            id: 'action-getting-started',
            label: 'Getting Started',
            query: 'How do I get started?',
            category: 'getting-started',
          },
          {
            id: 'action-find-projects',
            label: 'Find Projects',
            query: 'How do I find projects?',
            category: 'projects',
          }
        );
    }

    // Always add a support option if not already present
    if (!actions.some((a) => a.category === 'support')) {
      actions.push({
        id: 'action-need-help',
        label: 'Need More Help?',
        query: 'I need help from support',
        category: 'support',
      });
    }

    // Limit to 4 actions
    return actions.slice(0, 4);
  }

  /**
   * Format response with markdown
   */
  formatWithMarkdown(text: string): string {
    // Add line breaks for numbered lists
    let formatted = text.replace(/(\d+\))/g, '\n$1');

    // Ensure proper spacing
    formatted = formatted.replace(/\n{3,}/g, '\n\n');

    return formatted.trim();
  }

  /**
   * Add emoji to response based on category
   */
  addCategoryEmoji(text: string, category?: string): string {
    const emojiMap: Record<string, string> = {
      'getting-started': '🌱',
      projects: '🌳',
      education: '📚',
      community: '👥',
      verification: '✅',
      sponsorship: '💼',
      support: '💬',
    };

    const emoji = category ? emojiMap[category] : '🌿';
    return `${emoji} ${text}`;
  }
}

// Export singleton instance
export const responseGenerator = new ResponseGenerator();
