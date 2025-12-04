/**
 * AI Climate Companion Service
 * Green Mentor AI system for personalized guidance and recommendations
 */

import OpenAI from 'openai';
import { supabase } from './supabase';
import {
  ChatMessage,
  ChatContext,
  Recommendation,
  RecommendationRequest,
  AIServiceConfig,
  AIResponse,
  AIServiceError,
  ConceptExplanation,
  ExplanationRequest
} from '../types/aiCompanion.types';

class AICompanionService {
  private openai: OpenAI;
  private config: AIServiceConfig;

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }

    this.config = {
      apiKey,
      model: 'gpt-4o-mini',
      maxTokens: 1000,
      temperature: 0.7,
      systemPrompt: this.getSystemPrompt()
    };

    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      dangerouslyAllowBrowser: true // Note: In production, API calls should go through backend
    });
  }

  // ============================================================================
  // Chat Interface
  // ============================================================================

  async sendMessage(
    userId: string,
    message: string,
    context?: ChatContext
  ): Promise<ChatMessage> {
    try {
      // Store user message
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        userId,
        role: 'user',
        content: message,
        timestamp: new Date(),
        context
      };

      await this.storeChatMessage(userMessage);

      // Get conversation history
      const history = await this.getChatHistory(userId, 10);

      // Generate AI response
      const aiResponse = await this.generateResponse(message, context, history);

      // Store AI response
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        userId,
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
        context
      };

      await this.storeChatMessage(assistantMessage);

      return assistantMessage;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw this.handleAIError(error);
    }
  }

  async getChatHistory(userId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(msg => ({
        id: msg.id,
        userId: msg.user_id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        context: msg.context
      }));
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }
  }

  // ============================================================================
  // Recommendation Engine
  // ============================================================================

  async getRecommendations(request: RecommendationRequest): Promise<Recommendation[]> {
    try {
      // Use the dedicated recommendation engine service
      const { recommendationEngineService } = await import('./recommendationEngine.service');
      const recommendations = await recommendationEngineService.generateRecommendations(request);
      
      // Enhance recommendations with AI-generated descriptions if needed
      const enhancedRecommendations = await this.enhanceRecommendationsWithAI(recommendations);
      
      // Track analytics
      await this.trackRecommendationAnalytics(request.userId, enhancedRecommendations);

      return enhancedRecommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw this.handleAIError(error);
    }
  }

  /**
   * Get contextual suggestions based on current user state
   */
  async getContextualSuggestions(
    userId: string,
    context: ChatContext
  ): Promise<Recommendation[]> {
    try {
      const { recommendationEngineService } = await import('./recommendationEngine.service');
      return await recommendationEngineService.getContextualSuggestions(userId, context);
    } catch (error) {
      console.error('Error getting contextual suggestions:', error);
      throw this.handleAIError(error);
    }
  }

  // ============================================================================
  // Educational Explainer
  // ============================================================================

  /**
   * Explain an environmental concept in simple, age-appropriate language
   * Implements concept simplification for Requirement A2.2
   */
  async explainConcept(request: ExplanationRequest): Promise<ConceptExplanation> {
    try {
      const { concept, ageCohort, userInterests, context } = request;

      // Build age-appropriate prompt
      const prompt = this.buildExplanationPrompt(concept, ageCohort, userInterests, context);

      // Generate explanation using AI
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: this.getEducationalSystemPrompt(ageCohort) },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.7
      });

      const content = response.choices[0].message.content || '';

      // Parse the AI response into structured explanation
      const explanation = this.parseExplanationResponse(content, concept, ageCohort);

      // Store explanation for analytics
      await this.trackExplanationAnalytics(request, explanation);

      return explanation;
    } catch (error) {
      console.error('Error explaining concept:', error);
      throw this.handleAIError(error);
    }
  }

  /**
   * Get a list of common environmental concepts that can be explained
   */
  getCommonConcepts(): string[] {
    return [
      'Carbon Sequestration',
      'Climate Change',
      'Deforestation',
      'Biodiversity',
      'Renewable Energy',
      'Carbon Credits',
      'Greenhouse Gases',
      'Sustainable Development',
      'Conservation',
      'Ecosystem Services',
      'Water Conservation',
      'Waste Management',
      'Composting',
      'Reforestation',
      'Climate Justice',
      'Environmental Policy',
      'Green Economy',
      'Circular Economy',
      'Carbon Footprint',
      'Climate Adaptation'
    ];
  }

  /**
   * Answer a specific environmental question
   */
  async answerQuestion(
    question: string,
    ageCohort: AgeCohort,
    context?: string
  ): Promise<string> {
    try {
      const prompt = context 
        ? `Context: ${context}\n\nQuestion: ${question}`
        : question;

      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: this.getEducationalSystemPrompt(ageCohort) },
          { role: 'user', content: prompt }
        ],
        max_tokens: 600,
        temperature: 0.7
      });

      return response.choices[0].message.content || 'I apologize, but I could not generate an answer at this time.';
    } catch (error) {
      console.error('Error answering question:', error);
      throw this.handleAIError(error);
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private getSystemPrompt(): string {
    return `You are Green Mentor, an AI climate companion for the #GangGreen platform in Kenya. 
Your role is to guide users through their climate action journey with personalized, age-appropriate advice.

Key responsibilities:
- Provide clear, actionable climate action recommendations
- Explain environmental concepts in simple, accessible language
- Guide users through onboarding and platform features
- Encourage participation in tree planting, waste cleanup, and conservation
- Adapt your language and suggestions based on user age and interests

Always be encouraging, informative, and focused on practical climate action in Kenya.`;
  }

  private getEducationalSystemPrompt(ageCohort: AgeCohort): string {
    const ageGuidance = {
      '13-17': 'Use simple language suitable for teenagers. Include relatable examples from daily life. Keep explanations concise and engaging.',
      '18-24': 'Use clear, accessible language for young adults. Include practical examples and social media-friendly content.',
      '25-34': 'Use professional but accessible language. Include practical applications and career-relevant examples.',
      '35-49': 'Use clear, informative language. Include family and community-relevant examples.',
      '50+': 'Use respectful, clear language. Include historical context and legacy-focused examples.'
    };

    return `You are Green Mentor, an educational AI assistant for environmental concepts on the #GangGreen platform in Kenya.

Your role is to explain environmental concepts in simple, accessible language appropriate for users aged ${ageCohort}.

${ageGuidance[ageCohort]}

When explaining concepts:
1. Start with a simple, one-sentence definition
2. Provide 2-3 concrete examples relevant to Kenya
3. Explain why it matters for climate action
4. Suggest 1-2 actionable steps users can take
5. Mention related concepts they might want to learn about

Focus on practical climate action in Kenya and East Africa. Be encouraging and empowering.`;
  }

  private buildExplanationPrompt(
    concept: string,
    ageCohort: AgeCohort,
    userInterests?: string[],
    context?: string
  ): string {
    let prompt = `Please explain the environmental concept: "${concept}"

Format your response as follows:
SIMPLE EXPLANATION: [One clear sentence explaining what it is]

EXAMPLES: [2-3 concrete examples relevant to Kenya]

WHY IT MATTERS: [Why this is important for climate action]

ACTIONABLE STEPS: [1-2 things users can do]

RELATED CONCEPTS: [2-3 related topics they might want to learn about]`;

    if (userInterests && userInterests.length > 0) {
      prompt += `\n\nUser interests: ${userInterests.join(', ')}. Try to relate the explanation to these interests where relevant.`;
    }

    if (context) {
      prompt += `\n\nAdditional context: ${context}`;
    }

    return prompt;
  }

  private parseExplanationResponse(
    content: string,
    concept: string,
    ageCohort: AgeCohort
  ): ConceptExplanation {
    // Parse the structured response
    const sections = {
      simpleExplanation: this.extractSection(content, 'SIMPLE EXPLANATION'),
      examples: this.extractListSection(content, 'EXAMPLES'),
      whyItMatters: this.extractSection(content, 'WHY IT MATTERS'),
      actionableSteps: this.extractListSection(content, 'ACTIONABLE STEPS'),
      relatedConcepts: this.extractListSection(content, 'RELATED CONCEPTS')
    };

    // Determine age-appropriate level
    const ageLevel = this.getAgeLevel(ageCohort);

    return {
      concept,
      simpleExplanation: sections.simpleExplanation || content.substring(0, 200),
      ageAppropriateLevel: ageLevel,
      examples: sections.examples.length > 0 ? sections.examples : [
        'Example 1: Tree planting in Kakamega Forest',
        'Example 2: Community waste cleanup in Nairobi'
      ],
      relatedConcepts: sections.relatedConcepts.length > 0 ? sections.relatedConcepts : [
        'Climate Change',
        'Conservation',
        'Sustainability'
      ],
      actionableSteps: sections.actionableSteps.length > 0 ? sections.actionableSteps : undefined
    };
  }

  private extractSection(content: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}:\\s*([^\\n]+(?:\\n(?!\\w+:)[^\\n]+)*)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractListSection(content: string, sectionName: string): string[] {
    const section = this.extractSection(content, sectionName);
    if (!section) return [];

    // Split by newlines or numbered lists
    const items = section
      .split(/\n|(?:\d+\.)|(?:-)/g)
      .map(item => item.trim())
      .filter(item => item.length > 0);

    return items;
  }

  private getAgeLevel(ageCohort: AgeCohort): 'child' | 'teen' | 'adult' | 'senior' {
    switch (ageCohort) {
      case '13-17':
        return 'teen';
      case '18-24':
      case '25-34':
      case '35-49':
        return 'adult';
      case '50+':
        return 'senior';
      default:
        return 'adult';
    }
  }

  private async trackExplanationAnalytics(
    request: ExplanationRequest,
    explanation: ConceptExplanation
  ): Promise<void> {
    try {
      // Log analytics for concept explanations
      console.log('Explanation analytics:', {
        concept: request.concept,
        ageCohort: request.ageCohort,
        timestamp: new Date().toISOString()
      });
      // In production, this would be stored in an analytics table
    } catch (error) {
      console.error('Error tracking explanation analytics:', error);
    }
  }

  /**
   * Enhance recommendations with AI-generated descriptions
   */
  private async enhanceRecommendationsWithAI(
    recommendations: Recommendation[]
  ): Promise<Recommendation[]> {
    // For now, return recommendations as-is
    // In future, could use AI to generate more engaging descriptions
    return recommendations;
  }

  private async generateResponse(
    message: string,
    context: ChatContext | undefined,
    history: ChatMessage[]
  ): Promise<AIResponse> {
    const messages = [
      { role: 'system' as const, content: this.getSystemPrompt() },
      ...history.slice(-5).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { 
        role: 'user' as const, 
        content: this.buildContextualMessage(message, context) 
      }
    ];

    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content || '',
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      } : undefined,
      model: response.model,
      finishReason: choice.finish_reason
    };
  }

  private buildContextualMessage(message: string, context?: ChatContext): string {
    if (!context) return message;

    let contextInfo = `User context:
- Age cohort: ${context.ageCohort}
- Interests: ${context.userInterests.join(', ')}
- Current page: ${context.currentPage}`;

    if (context.journeyStage) {
      contextInfo += `\n- Journey stage: ${context.journeyStage}`;
    }

    if (context.location) {
      contextInfo += `\n- Location: ${context.location.county}${context.location.subCounty ? ', ' + context.location.subCounty : ''}`;
    }

    if (context.recentActions.length > 0) {
      contextInfo += `\n- Recent actions: ${context.recentActions.slice(0, 3).join(', ')}`;
    }

    return `${contextInfo}\n\nUser message: ${message}`;
  }



  private async storeChatMessage(message: ChatMessage): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          id: message.id,
          user_id: message.userId,
          role: message.role,
          content: message.content,
          context: message.context,
          timestamp: message.timestamp.toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing chat message:', error);
      // Don't throw - message storage failure shouldn't break the chat
    }
  }

  private async trackRecommendationAnalytics(
    userId: string,
    recommendations: Recommendation[]
  ): Promise<void> {
    try {
      // Store analytics for each recommendation
      const analytics = recommendations.map(rec => ({
        recommendation_id: rec.id,
        user_id: userId,
        type: rec.type,
        relevance_score: rec.relevanceScore,
        timestamp: new Date().toISOString()
      }));

      // This would be stored in a recommendation_analytics table
      // For now, just log it
      console.log('Recommendation analytics:', analytics);
    } catch (error) {
      console.error('Error tracking recommendation analytics:', error);
    }
  }

  private handleAIError(error: any): AIServiceError {
    if (error.status === 429) {
      return {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        type: 'rate_limit',
        retryable: true,
        retryAfter: error.headers?.['retry-after'] ? parseInt(error.headers['retry-after']) : 60
      };
    }

    if (error.status === 401) {
      return {
        code: 'INVALID_API_KEY',
        message: 'Invalid API key configuration',
        type: 'api_error',
        retryable: false
      };
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to AI service',
        type: 'network_error',
        retryable: true
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
      type: 'api_error',
      retryable: false
    };
  }
}

export const aiCompanionService = new AICompanionService();
   