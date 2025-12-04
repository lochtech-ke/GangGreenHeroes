/**
 * Verification-as-a-Service (VaaS) Service
 * Handles evidence submission, review, and report generation
 * Requirements: A6.1, A6.2, A6.3, A6.4, A6.5
 */

import { supabase } from './supabase';
import { completeMission } from './mission.service';
import type { VerificationEvidence, VerificationReview } from '../types/mission.types';

export interface EvidenceSubmission {
  action_id: string;
  action_type: string;
  evidence_type: 'photo' | 'video' | 'gps' | 'document';
  files: File[];
  description?: string;
  gps_coordinates?: [number, number]; // [longitude, latitude]
}

export interface VerificationReport {
  evidence: VerificationEvidence;
  review?: VerificationReview;
  action_details: {
    title: string;
    type: string;
    date: string;
  };
  user_details: {
    name: string;
    id: string;
  };
  validation_details: {
    gps_verified: boolean;
    photo_count: number;
    submission_date: string;
  };
}

export interface ReviewSubmission {
  evidence_id: string;
  reviewer_organization: 'GBM' | 'WMF' | 'KFS' | 'community_leader';
  status: 'approved' | 'rejected' | 'needs_more_info';
  comments?: string;
}

class VaaSService {
  /**
   * Submit verification evidence for a climate action
   * Requirement A6.1: Require geo-tagged photos or videos as evidence
   */
  async submitEvidence(submission: EvidenceSubmission, userId: string): Promise<VerificationEvidence> {
    try {
      // Upload files to Supabase Storage
      const uploadedFiles = await this.uploadEvidenceFiles(submission.files, userId);

      // Create evidence record
      const evidenceData = {
        action_id: submission.action_id,
        action_type: submission.action_type,
        user_id: userId,
        evidence_type: submission.evidence_type,
        files: uploadedFiles,
        description: submission.description,
        gps_coordinates: submission.gps_coordinates
          ? {
              type: 'Point' as const,
              coordinates: submission.gps_coordinates,
            }
          : null,
      };

      const { data, error } = await supabase
        .from('verification_evidence')
        .insert(evidenceData)
        .select()
        .single();

      if (error) throw error;

      // Update mission participation status if applicable
      if (submission.action_type === 'mission') {
        await this.updateMissionVerificationStatus(submission.action_id, userId, 'submitted');
      }

      return data;
    } catch (error) {
      console.error('Error submitting evidence:', error);
      throw new Error('Failed to submit verification evidence');
    }
  }

  /**
   * Upload evidence files to Supabase Storage
   */
  private async uploadEvidenceFiles(
    files: File[],
    userId: string
  ): Promise<Array<{ url: string; metadata: any }>> {
    const uploadedFiles = [];

    for (const file of files) {
      try {
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${userId}/${timestamp}_${file.name}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('verification-evidence')
          .upload(filename, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('verification-evidence').getPublicUrl(data.path);

        // Extract metadata from file
        const metadata: any = {
          filename: file.name,
          size: file.size,
          type: file.type,
          timestamp: new Date().toISOString(),
        };

        // Try to extract GPS from EXIF if it's an image
        if (file.type.startsWith('image/')) {
          const gpsData = await this.extractGPSFromImage(file);
          if (gpsData) {
            metadata.gps_coordinates = gpsData;
          }
        }

        uploadedFiles.push({
          url: publicUrl,
          metadata,
        });
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        throw new Error(`Failed to upload file: ${file.name}`);
      }
    }

    return uploadedFiles;
  }

  /**
   * Extract GPS coordinates from image EXIF data
   */
  private async extractGPSFromImage(_file: File): Promise<[number, number] | null> {
    // This is a placeholder - in production, use a library like exif-js
    // For now, return null and rely on manual GPS input
    return null;
  }

  /**
   * Update mission participation verification status
   */
  private async updateMissionVerificationStatus(
    missionId: string,
    userId: string,
    status: 'pending' | 'submitted' | 'approved' | 'rejected'
  ): Promise<void> {
    const { error } = await supabase
      .from('mission_participations')
      .update({ verification_status: status })
      .eq('mission_id', missionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating mission verification status:', error);
    }
  }

  /**
   * Get evidence by ID
   */
  async getEvidence(evidenceId: string): Promise<VerificationEvidence | null> {
    try {
      const { data, error } = await supabase
        .from('verification_evidence')
        .select('*')
        .eq('id', evidenceId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching evidence:', error);
      return null;
    }
  }

  /**
   * Get evidence for a specific action
   */
  async getEvidenceForAction(actionId: string, actionType: string): Promise<VerificationEvidence[]> {
    try {
      const { data, error } = await supabase
        .from('verification_evidence')
        .select('*')
        .eq('action_id', actionId)
        .eq('action_type', actionType)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching evidence for action:', error);
      return [];
    }
  }

  /**
   * Get evidence submitted by a user
   */
  async getUserEvidence(userId: string): Promise<VerificationEvidence[]> {
    try {
      const { data, error } = await supabase
        .from('verification_evidence')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user evidence:', error);
      return [];
    }
  }

  /**
   * Get pending evidence for review
   * Requirement A6.2: Route submissions to expert reviewers
   */
  async getPendingEvidence(limit: number = 50): Promise<VerificationEvidence[]> {
    try {
      // Get evidence that hasn't been reviewed yet
      const { data: evidence, error: evidenceError } = await supabase
        .from('verification_evidence')
        .select('*')
        .order('submitted_at', { ascending: true })
        .limit(limit);

      if (evidenceError) throw evidenceError;

      // Filter out evidence that already has a review
      const evidenceIds = evidence?.map((e) => e.id) || [];
      if (evidenceIds.length === 0) return [];

      const { data: reviews, error: reviewsError } = await supabase
        .from('verification_reviews')
        .select('evidence_id')
        .in('evidence_id', evidenceIds);

      if (reviewsError) throw reviewsError;

      const reviewedIds = new Set(reviews?.map((r) => r.evidence_id) || []);
      return evidence?.filter((e) => !reviewedIds.has(e.id)) || [];
    } catch (error) {
      console.error('Error fetching pending evidence:', error);
      return [];
    }
  }

  /**
   * Submit a verification review
   * Requirement A6.2: Expert review from partner organizations
   */
  async submitReview(review: ReviewSubmission, reviewerId: string): Promise<VerificationReview> {
    try {
      const reviewData = {
        evidence_id: review.evidence_id,
        reviewer_id: reviewerId,
        reviewer_organization: review.reviewer_organization,
        status: review.status,
        comments: review.comments,
      };

      const { data, error } = await supabase
        .from('verification_reviews')
        .insert(reviewData)
        .select()
        .single();

      if (error) throw error;

      // If approved, update mission participation and award GG Coins
      if (review.status === 'approved') {
        await this.handleApprovedVerification(review.evidence_id);
      }

      return data;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw new Error('Failed to submit verification review');
    }
  }

  /**
   * Handle approved verification - update status and award rewards
   */
  private async handleApprovedVerification(evidenceId: string): Promise<void> {
    try {
      // Get evidence details
      const evidence = await this.getEvidence(evidenceId);
      if (!evidence) return;

      // Update mission participation if applicable
      if (evidence.action_type === 'mission') {
        await this.updateMissionVerificationStatus(
          evidence.action_id,
          evidence.user_id,
          'approved'
        );

        // Award GG Coins for verified mission completion
        const result = await completeMission(evidence.user_id, evidence.action_id);
        
        if (result.success) {
          console.log(
            `Awarded ${result.coinsAwarded} GG Coins for verified mission: ${evidence.action_id}`
          );
        } else {
          console.error(
            `Failed to award GG Coins for mission ${evidence.action_id}:`,
            result.error
          );
        }
      }
    } catch (error) {
      console.error('Error handling approved verification:', error);
    }
  }

  /**
   * Get review for evidence
   */
  async getReview(evidenceId: string): Promise<VerificationReview | null> {
    try {
      const { data, error } = await supabase
        .from('verification_reviews')
        .select('*')
        .eq('evidence_id', evidenceId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching review:', error);
      return null;
    }
  }

  /**
   * Generate verification report
   * Requirements: A6.3, A6.4, A6.5: Generate public project reports
   */
  async generateVerificationReport(evidenceId: string): Promise<VerificationReport | null> {
    try {
      // Get evidence
      const evidence = await this.getEvidence(evidenceId);
      if (!evidence) throw new Error('Evidence not found');

      // Get review
      const review = await this.getReview(evidenceId);

      // Get action details based on action type
      const actionDetails = await this.getActionDetails(evidence.action_id, evidence.action_type);

      // Get user details
      const { data: user, error: userError } = await supabase
        .from('user_profiles')
        .select('display_name, id')
        .eq('id', evidence.user_id)
        .single();

      if (userError) throw userError;

      // Build validation details
      const validationDetails = {
        gps_verified: !!evidence.gps_coordinates,
        photo_count: evidence.files.length,
        submission_date: evidence.submitted_at,
      };

      return {
        evidence,
        review: review || undefined,
        action_details: actionDetails,
        user_details: {
          name: user.display_name,
          id: user.id,
        },
        validation_details: validationDetails,
      };
    } catch (error) {
      console.error('Error generating verification report:', error);
      return null;
    }
  }

  /**
   * Get action details based on action type
   */
  private async getActionDetails(
    actionId: string,
    actionType: string
  ): Promise<{ title: string; type: string; date: string }> {
    try {
      if (actionType === 'mission') {
        const { data, error } = await supabase
          .from('missions')
          .select('title, mission_type, start_date')
          .eq('id', actionId)
          .single();

        if (error) throw error;

        return {
          title: data.title,
          type: data.mission_type,
          date: data.start_date,
        };
      }

      // Add other action types as needed
      return {
        title: 'Unknown Action',
        type: actionType,
        date: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching action details:', error);
      return {
        title: 'Unknown Action',
        type: actionType,
        date: new Date().toISOString(),
      };
    }
  }

  /**
   * Get all verification reports for a user
   */
  async getUserVerificationReports(userId: string): Promise<VerificationReport[]> {
    try {
      const evidence = await this.getUserEvidence(userId);
      const reports = await Promise.all(
        evidence.map((e) => this.generateVerificationReport(e.id))
      );
      return reports.filter((r): r is VerificationReport => r !== null);
    } catch (error) {
      console.error('Error fetching user verification reports:', error);
      return [];
    }
  }
}

export const vaasService = new VaaSService();
