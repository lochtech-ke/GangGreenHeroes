import { supabase } from './supabase';

export interface AmbassadorApplication {
  userId: string;
  county: string;
  subCounty?: string;
  specializations: string[];
  motivation: string;
  experience?: string;
}

export interface Ambassador {
  userId: string;
  applicationDate: Date;
  approvedAt?: Date;
  approvedBy?: string;
  county: string;
  subCounty?: string;
  specializations: string[];
  eventsOrganized: number;
  membersReferred: number;
  impactScore: number;
  status: 'pending' | 'active' | 'inactive' | 'suspended';
}

export interface AmbassadorEligibility {
  eligible: boolean;
  reasons: string[];
  requirements: {
    minGGCoins: number;
    minTreesPlanted: number;
    minMissionsCompleted: number;
    hasGGCoins: boolean;
    hasTreesPlanted: boolean;
    hasMissionsCompleted: boolean;
  };
}

class AmbassadorService {
  /**
   * Check if a user is eligible to apply for ambassador status
   */
  async checkEligibility(userId: string): Promise<AmbassadorEligibility> {
    try {
      // Check if user already has an application
      const { data: existingApplication } = await supabase
        .from('ambassadors')
        .select('status')
        .eq('user_id', userId)
        .single();

      if (existingApplication) {
        return {
          eligible: false,
          reasons: [`You already have an ${existingApplication.status} ambassador application`],
          requirements: {
            minGGCoins: 100,
            minTreesPlanted: 10,
            minMissionsCompleted: 5,
            hasGGCoins: false,
            hasTreesPlanted: false,
            hasMissionsCompleted: false,
          },
        };
      }

      // Get user's GG Coins
      const { data: gamification } = await supabase
        .from('user_gamification')
        .select('gg_coins')
        .eq('id', userId)
        .single();

      const ggCoins = gamification?.gg_coins || 0;

      // Get user's trees planted
      const { count: treesPlanted } = await supabase
        .from('planted_trees')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get user's missions completed
      const { count: missionsCompleted } = await supabase
        .from('mission_participations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('verification_status', 'approved');

      // Define eligibility requirements
      const MIN_GG_COINS = 100;
      const MIN_TREES_PLANTED = 10;
      const MIN_MISSIONS_COMPLETED = 5;

      const hasGGCoins = ggCoins >= MIN_GG_COINS;
      const hasTreesPlanted = (treesPlanted || 0) >= MIN_TREES_PLANTED;
      const hasMissionsCompleted = (missionsCompleted || 0) >= MIN_MISSIONS_COMPLETED;

      const eligible = hasGGCoins && hasTreesPlanted && hasMissionsCompleted;

      const reasons: string[] = [];
      if (!hasGGCoins) {
        reasons.push(`You need at least ${MIN_GG_COINS} GG Coins (you have ${ggCoins})`);
      }
      if (!hasTreesPlanted) {
        reasons.push(`You need to have planted at least ${MIN_TREES_PLANTED} trees (you have ${treesPlanted || 0})`);
      }
      if (!hasMissionsCompleted) {
        reasons.push(`You need to have completed at least ${MIN_MISSIONS_COMPLETED} missions (you have ${missionsCompleted || 0})`);
      }

      if (eligible) {
        reasons.push('You meet all requirements to apply!');
      }

      return {
        eligible,
        reasons,
        requirements: {
          minGGCoins: MIN_GG_COINS,
          minTreesPlanted: MIN_TREES_PLANTED,
          minMissionsCompleted: MIN_MISSIONS_COMPLETED,
          hasGGCoins,
          hasTreesPlanted,
          hasMissionsCompleted,
        },
      };
    } catch (error) {
      console.error('Error checking ambassador eligibility:', error);
      throw error;
    }
  }

  /**
   * Submit an ambassador application
   */
  async submitApplication(application: AmbassadorApplication): Promise<Ambassador> {
    try {
      // Check eligibility first
      const eligibility = await this.checkEligibility(application.userId);
      if (!eligibility.eligible) {
        throw new Error(`Not eligible to apply: ${eligibility.reasons.join(', ')}`);
      }

      // Insert ambassador application
      const { data, error } = await supabase
        .from('ambassadors')
        .insert({
          user_id: application.userId,
          county: application.county,
          sub_county: application.subCounty,
          specializations: application.specializations,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Update user profile to mark as ambassador applicant
      await supabase
        .from('user_profiles')
        .update({ is_ambassador: false }) // Will be set to true when approved
        .eq('user_id', application.userId);

      return this.mapToAmbassador(data);
    } catch (error) {
      console.error('Error submitting ambassador application:', error);
      throw error;
    }
  }

  /**
   * Get ambassador status for a user
   */
  async getAmbassadorStatus(userId: string): Promise<Ambassador | null> {
    try {
      const { data, error } = await supabase
        .from('ambassadors')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No ambassador record found
          return null;
        }
        throw error;
      }

      return this.mapToAmbassador(data);
    } catch (error) {
      console.error('Error getting ambassador status:', error);
      throw error;
    }
  }

  /**
   * Get all active ambassadors
   */
  async getActiveAmbassadors(): Promise<Ambassador[]> {
    try {
      const { data, error } = await supabase
        .from('ambassadors')
        .select(`
          *,
          user_profiles!inner(display_name, avatar, location)
        `)
        .eq('status', 'active')
        .order('impact_score', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapToAmbassador);
    } catch (error) {
      console.error('Error getting active ambassadors:', error);
      throw error;
    }
  }

  /**
   * Get ambassadors by county
   */
  async getAmbassadorsByCounty(county: string): Promise<Ambassador[]> {
    try {
      const { data, error } = await supabase
        .from('ambassadors')
        .select(`
          *,
          user_profiles!inner(display_name, avatar, location)
        `)
        .eq('status', 'active')
        .eq('county', county)
        .order('impact_score', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapToAmbassador);
    } catch (error) {
      console.error('Error getting ambassadors by county:', error);
      throw error;
    }
  }

  /**
   * Update ambassador statistics
   */
  async updateAmbassadorStats(
    userId: string,
    updates: {
      eventsOrganized?: number;
      membersReferred?: number;
      impactScore?: number;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('ambassadors')
        .update({
          events_organized: updates.eventsOrganized,
          members_referred: updates.membersReferred,
          impact_score: updates.impactScore,
        })
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating ambassador stats:', error);
      throw error;
    }
  }

  /**
   * Increment events organized count
   */
  async incrementEventsOrganized(userId: string): Promise<void> {
    try {
      const { data: ambassador } = await supabase
        .from('ambassadors')
        .select('events_organized')
        .eq('user_id', userId)
        .single();

      if (ambassador) {
        await this.updateAmbassadorStats(userId, {
          eventsOrganized: (ambassador.events_organized || 0) + 1,
        });
      }
    } catch (error) {
      console.error('Error incrementing events organized:', error);
      throw error;
    }
  }

  /**
   * Increment members referred count
   */
  async incrementMembersReferred(userId: string): Promise<void> {
    try {
      const { data: ambassador } = await supabase
        .from('ambassadors')
        .select('members_referred')
        .eq('user_id', userId)
        .single();

      if (ambassador) {
        await this.updateAmbassadorStats(userId, {
          membersReferred: (ambassador.members_referred || 0) + 1,
        });
      }
    } catch (error) {
      console.error('Error incrementing members referred:', error);
      throw error;
    }
  }

  /**
   * Calculate and update impact score
   */
  async calculateImpactScore(userId: string): Promise<number> {
    try {
      const ambassador = await this.getAmbassadorStatus(userId);
      if (!ambassador) return 0;

      // Impact score formula:
      // Events organized * 10 + Members referred * 5 + Trees planted + Missions completed * 3
      const { data: wallet } = await supabase
        .from('green_coin_wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      const { count: treesPlanted } = await supabase
        .from('planted_trees')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: missionsCompleted } = await supabase
        .from('mission_participations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('verification_status', 'approved');

      const impactScore =
        ambassador.eventsOrganized * 10 +
        ambassador.membersReferred * 5 +
        (treesPlanted || 0) +
        (missionsCompleted || 0) * 3;

      await this.updateAmbassadorStats(userId, { impactScore });

      return impactScore;
    } catch (error) {
      console.error('Error calculating impact score:', error);
      throw error;
    }
  }

  /**
   * Map database record to Ambassador interface
   */
  private mapToAmbassador(data: any): Ambassador {
    return {
      userId: data.user_id,
      applicationDate: new Date(data.application_date),
      approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
      approvedBy: data.approved_by,
      county: data.county,
      subCounty: data.sub_county,
      specializations: data.specializations || [],
      eventsOrganized: data.events_organized || 0,
      membersReferred: data.members_referred || 0,
      impactScore: data.impact_score || 0,
      status: data.status,
    };
  }
}

export const ambassadorService = new AmbassadorService();
