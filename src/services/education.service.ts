/**
 * Education Service
 * Handles learning modules, lessons, progress tracking, and certificates
 */

import { supabase } from './supabase';
import { ggCoinService, type RewardMultiplier } from './ggCoin.service';
import type {
  LearningModule,
  UserLearningProgress,
} from '../types/platform.types';

export class EducationService {
  /**
   * Get all available learning modules
   */
  async getLearningModules(filters?: {
    category?: string;
    difficulty?: string;
    ageTargeting?: string[];
  }): Promise<LearningModule[]> {
    let query = supabase
      .from('learning_modules')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch learning modules: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a specific learning module with its lessons
   */
  async getLearningModule(moduleId: string): Promise<LearningModule | null> {
    const { data: module, error: moduleError } = await supabase
      .from('learning_modules')
      .select('*')
      .eq('id', moduleId)
      .single();

    if (moduleError) {
      throw new Error(`Failed to fetch learning module: ${moduleError.message}`);
    }

    if (!module) {
      return null;
    }

    // Fetch lessons for this module
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index', { ascending: true });

    if (lessonsError) {
      throw new Error(`Failed to fetch lessons: ${lessonsError.message}`);
    }

    return {
      ...module,
      lessons: lessons || [],
    };
  }

  /**
   * Get user's learning progress
   */
  async getUserProgress(userId: string): Promise<UserLearningProgress[]> {
    const { data, error } = await supabase
      .from('user_learning_progress')
      .select(`
        *,
        learning_modules (
          id,
          title,
          description,
          category,
          difficulty,
          duration,
          green_coin_reward
        )
      `)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch user progress: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get user's progress for a specific module
   */
  async getModuleProgress(
    userId: string,
    moduleId: string
  ): Promise<UserLearningProgress | null> {
    const { data, error } = await supabase
      .from('user_learning_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error
      throw new Error(`Failed to fetch module progress: ${error.message}`);
    }

    return data || null;
  }

  /**
   * Mark a lesson as completed
   */
  async completeLesson(
    userId: string,
    moduleId: string,
    lessonId: string
  ): Promise<void> {
    // Get current progress
    const progress = await this.getModuleProgress(userId, moduleId);

    if (!progress) {
      // Create new progress record
      const { error } = await supabase.from('user_learning_progress').insert({
        user_id: userId,
        module_id: moduleId,
        completed_lessons: [lessonId],
      });

      if (error) {
        throw new Error(`Failed to create progress record: ${error.message}`);
      }
    } else {
      // Update existing progress
      const completedLessons = progress.completedLessons || [];
      if (!completedLessons.includes(lessonId)) {
        completedLessons.push(lessonId);

        const { error } = await supabase
          .from('user_learning_progress')
          .update({ completed_lessons: completedLessons })
          .eq('user_id', userId)
          .eq('module_id', moduleId);

        if (error) {
          throw new Error(`Failed to update progress: ${error.message}`);
        }
      }
    }
  }

  /**
   * Complete a module and award rewards
   */
  async completeModule(
    userId: string,
    moduleId: string,
    quizScore?: number
  ): Promise<{ ggCoinsAwarded: number; certificateIssued: boolean }> {
    // Get the module details
    const module = await this.getLearningModule(moduleId);
    if (!module) {
      throw new Error('Module not found');
    }

    // Mark module as completed
    const { error: progressError } = await supabase
      .from('user_learning_progress')
      .update({
        completed_at: new Date().toISOString(),
        quiz_score: quizScore,
        certificate_issued: true,
      })
      .eq('user_id', userId)
      .eq('module_id', moduleId);

    if (progressError) {
      throw new Error(`Failed to complete module: ${progressError.message}`);
    }

    // Award GG Coins with multipliers
    let ggCoinsAwarded = 0;
    const baseReward = module.ggCoinReward || 20; // Default to base learning_module reward

    // Build multipliers based on quiz score and difficulty
    const multipliers: RewardMultiplier[] = [];
    
    // Perfect score multiplier
    if (quizScore !== undefined && quizScore >= 100) {
      multipliers.push({ condition: 'quiz_perfect_score', factor: 1.5 });
    }
    
    // Advanced difficulty multiplier
    if (module.difficulty === 'advanced') {
      multipliers.push({ condition: 'advanced_difficulty', factor: 2.0 });
    }

    // Calculate and award coins
    const reward = ggCoinService.calculateReward('learning_module', baseReward / 20, multipliers);
    
    if (reward > 0) {
      const transaction = await ggCoinService.creditCoins(
        userId,
        reward,
        'earn',
        `Completed learning module: ${module.title}`,
        {
          moduleId,
          moduleTitle: module.title,
          moduleCategory: module.category,
          moduleDifficulty: module.difficulty,
          quizScore,
          multipliers: multipliers.map(m => m.condition),
        }
      );

      if (transaction) {
        ggCoinsAwarded = transaction.amount;
      }
    }

    return {
      ggCoinsAwarded,
      certificateIssued: true,
    };
  }





  /**
   * Get daily climate fact/nugget
   */
  async getDailyNugget(): Promise<{ content: string; source?: string } | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_nuggets')
        .select('content, source')
        .eq('date', today)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch daily nugget:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception fetching daily nugget:', error);
      return null;
    }
  }

  /**
   * Generate certificate for completed module
   */
  async generateCertificate(
    userId: string,
    moduleId: string
  ): Promise<{ certificateUrl: string; certificateId: string } | null> {
    try {
      // Get module and user details
      const module = await this.getLearningModule(moduleId);
      if (!module) {
        throw new Error('Module not found');
      }

      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        throw new Error('User not found');
      }

      // Create certificate record
      const { data: certificate, error: certError } = await supabase
        .from('certificates')
        .insert({
          user_id: userId,
          module_id: moduleId,
          user_name: userData.full_name,
          module_title: module.title,
          completed_at: new Date().toISOString(),
          issuer: 'GangGreen Platform',
        })
        .select()
        .single();

      if (certError || !certificate) {
        throw new Error('Failed to create certificate');
      }

      // Generate certificate URL (could be a PDF generation service)
      const certificateUrl = `/certificates/${certificate.id}`;

      return {
        certificateUrl,
        certificateId: certificate.id,
      };
    } catch (error) {
      console.error('Failed to generate certificate:', error);
      return null;
    }
  }

  /**
   * Get learning statistics for a user
   */
  async getLearningStats(userId: string): Promise<{
    modulesCompleted: number;
    totalGGCoinsEarned: number;
    certificatesEarned: number;
    currentStreak: number;
  }> {
    const { data: progress, error } = await supabase
      .from('user_learning_progress')
      .select('*')
      .eq('user_id', userId)
      .not('completed_at', 'is', null);

    if (error) {
      throw new Error(`Failed to fetch learning stats: ${error.message}`);
    }

    const modulesCompleted = progress?.length || 0;
    const certificatesEarned = progress?.filter((p) => p.certificateIssued).length || 0;

    // Calculate total GG Coins from learning
    const { data: transactions, error: txError } = await supabase
      .from('gg_coin_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('transaction_type', 'earn')
      .contains('metadata', { actionType: 'learning_module' });

    if (txError) {
      throw new Error(`Failed to fetch transactions: ${txError.message}`);
    }

    const totalGGCoinsEarned = transactions?.reduce(
      (sum, tx) => sum + parseFloat(tx.amount),
      0
    ) || 0;

    return {
      modulesCompleted,
      totalGGCoinsEarned,
      certificatesEarned,
      currentStreak: 0, // TODO: Implement streak calculation
    };
  }
}

export const educationService = new EducationService();
