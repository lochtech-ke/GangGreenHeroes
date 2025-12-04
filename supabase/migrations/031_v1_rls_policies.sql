-- Migration: V1.0 Row Level Security Policies
-- Description: Comprehensive RLS policies for all V1.0 tables
-- Requirements: A1.1, A1.2, B5.5, C1.1

-- ============================================================================
-- SECTION 1: ENABLE RLS ON ALL TABLES
-- ============================================================================

-- Platform Vision tables
ALTER TABLE user_climate_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE green_coin_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE green_coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE planted_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tree_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE petitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE petition_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Content Curation tables
ALTER TABLE content_age_targeting ENABLE ROW LEVEL SECURITY;
ALTER TABLE curation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE relevance_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_engagement_metrics ENABLE ROW LEVEL SECURITY;

-- Error Handling tables
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_breaker_state ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 2: USER CLIMATE INTERESTS POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own climate interests"
  ON user_climate_interests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own climate interests"
  ON user_climate_interests
  FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 3: COMMUNITIES POLICIES
-- ============================================================================

CREATE POLICY "Anyone can view public communities"
  ON communities
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create communities"
  ON communities
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Community creators and admins can update communities"
  ON communities
  FOR UPDATE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can view community members"
  ON community_members
  FOR SELECT
  USING (true);

CREATE POLICY "Users can join communities"
  ON community_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities or admins can manage"
  ON community_members
  FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_members.community_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Community members can view posts"
  ON community_posts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_posts.community_id
      AND community_members.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Community members can create posts"
  ON community_posts
  FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_posts.community_id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authors and moderators can update posts"
  ON community_posts
  FOR UPDATE
  USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_posts.community_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('admin', 'moderator')
    )
  );

-- ============================================================================
-- SECTION 4: LEARNING MODULES POLICIES
-- ============================================================================

CREATE POLICY "Anyone can view published learning modules"
  ON learning_modules
  FOR SELECT
  USING (is_published = true OR auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create learning modules"
  ON learning_modules
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators and admins can update learning modules"
  ON learning_modules
  FOR UPDATE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Anyone can view lessons of published modules"
  ON lessons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM learning_modules lm
      WHERE lm.id = lessons.module_id
      AND (lm.is_published = true OR lm.created_by = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Module creators can manage lessons"
  ON lessons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM learning_modules lm
      WHERE lm.id = lessons.module_id
      AND lm.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own learning progress"
  ON user_learning_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning progress"
  ON user_learning_progress
  FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 5: MISSIONS POLICIES
-- ============================================================================

CREATE POLICY "Anyone can view active missions"
  ON missions
  FOR SELECT
  USING (
    status IN ('upcoming', 'active') OR
    auth.uid() = organizer_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create missions"
  ON missions
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Organizers and admins can update missions"
  ON missions
  FOR UPDATE
  USING (
    auth.uid() = organizer_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can view mission participations"
  ON mission_participations
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM missions m
      WHERE m.id = mission_participations.mission_id
      AND m.organizer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can join missions"
  ON mission_participations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation"
  ON mission_participations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 6: VERIFICATION POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own verification evidence"
  ON verification_evidence
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can submit verification evidence"
  ON verification_evidence
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Reviewers can view evidence for review"
  ON verification_reviews
  FOR SELECT
  USING (
    auth.uid() = reviewer_id OR
    EXISTS (
      SELECT 1 FROM verification_evidence ve
      WHERE ve.id = verification_reviews.evidence_id
      AND ve.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Authorized reviewers can create reviews"
  ON verification_reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'organization')
    )
  );

-- ============================================================================
-- SECTION 7: GREEN COINS POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own wallet"
  ON green_coin_wallets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
  ON green_coin_wallets
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions"
  ON green_coin_transactions
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can create transactions"
  ON green_coin_transactions
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- SECTION 8: TREE WALLET POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own trees"
  ON planted_trees
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can add their own trees"
  ON planted_trees
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trees"
  ON planted_trees
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view photos of their trees"
  ON tree_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM planted_trees pt
      WHERE pt.id = tree_photos.tree_id
      AND pt.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can add photos to their trees"
  ON tree_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM planted_trees pt
      WHERE pt.id = tree_photos.tree_id
      AND pt.user_id = auth.uid()
    )
  );

-- ============================================================================
-- SECTION 9: GAMIFICATION POLICIES
-- ============================================================================

CREATE POLICY "Anyone can view badges"
  ON badges
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage badges"
  ON badges
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own badges"
  ON user_badges
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can award badges"
  ON user_badges
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own streaks"
  ON user_streaks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
  ON user_streaks
  FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 10: AMBASSADOR POLICIES
-- ============================================================================

CREATE POLICY "Anyone can view active ambassadors"
  ON ambassadors
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can apply to be ambassadors"
  ON ambassadors
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own ambassador status"
  ON ambassadors
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage ambassador applications"
  ON ambassadors
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- SECTION 11: PETITION POLICIES
-- ============================================================================

CREATE POLICY "Anyone can view active petitions"
  ON petitions
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "Authenticated users can create petitions"
  ON petitions
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators and admins can update petitions"
  ON petitions
  FOR UPDATE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Add missing public_display column to petition_signatures
ALTER TABLE petition_signatures ADD COLUMN IF NOT EXISTS public_display BOOLEAN DEFAULT false;

CREATE POLICY "Anyone can view petition signatures"
  ON petition_signatures
  FOR SELECT
  USING (public_display = true);

CREATE POLICY "Users can sign petitions"
  ON petition_signatures
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own signatures"
  ON petition_signatures
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 12: CHAT MESSAGES POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own chat messages"
  ON chat_messages
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat messages"
  ON chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SECTION 13: CONTENT CURATION POLICIES
-- ============================================================================

CREATE POLICY "Content creators can manage age targeting"
  ON content_age_targeting
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'organization')
    )
  );

CREATE POLICY "Anyone can view age targeting for content discovery"
  ON content_age_targeting
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage curation rules"
  ON curation_rules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can log content interactions"
  ON content_interactions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own interactions"
  ON content_interactions
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own relevance scores"
  ON relevance_scores
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can manage relevance scores"
  ON relevance_scores
  FOR ALL
  WITH CHECK (true);

CREATE POLICY "Admins can view cohort engagement metrics"
  ON cohort_engagement_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can update cohort metrics"
  ON cohort_engagement_metrics
  FOR ALL
  WITH CHECK (true);

-- ============================================================================
-- SECTION 14: ERROR HANDLING POLICIES
-- ============================================================================

CREATE POLICY "Admins can view error logs"
  ON error_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can create error logs"
  ON error_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update error logs"
  ON error_logs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can view error analytics"
  ON error_analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can manage error analytics"
  ON error_analytics
  FOR ALL
  WITH CHECK (true);

CREATE POLICY "System can manage circuit breaker state"
  ON circuit_breaker_state
  FOR ALL
  WITH CHECK (true);

CREATE POLICY "Admins can view circuit breaker state"
  ON circuit_breaker_state
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- SECTION 15: ADDITIONAL SECURITY FUNCTIONS
-- ============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE users.id = user_uuid
    AND users.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is community moderator
CREATE OR REPLACE FUNCTION is_community_moderator(user_uuid UUID, community_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.user_id = user_uuid
    AND community_members.community_id = community_uuid
    AND community_members.role IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can review verification evidence
CREATE OR REPLACE FUNCTION can_review_evidence(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE users.id = user_uuid
    AND users.role IN ('admin', 'organization')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 16: COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION is_admin IS 'Checks if user has admin role';
COMMENT ON FUNCTION is_community_moderator IS 'Checks if user is moderator of specific community';
COMMENT ON FUNCTION can_review_evidence IS 'Checks if user can review verification evidence';