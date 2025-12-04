-- Community Hub Migration
-- Creates tables and functions for community management
-- Requirements: A3.1, A3.2, A3.3, A3.4, A3.5

-- ============================================================================
-- Communities Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  county VARCHAR(50),
  sub_county VARCHAR(50),
  member_count INTEGER DEFAULT 0,
  activity_level VARCHAR(20) DEFAULT 'low' CHECK (activity_level IN ('low', 'medium', 'high')),
  avatar TEXT,
  cover_image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- Community Members Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_members (
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

-- ============================================================================
-- Community Posts Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images TEXT[],
  links TEXT[],
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_communities_county ON communities(county);
CREATE INDEX IF NOT EXISTS idx_communities_activity ON communities(activity_level);
CREATE INDEX IF NOT EXISTS idx_communities_created ON communities(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id);

CREATE INDEX IF NOT EXISTS idx_community_posts_community ON community_posts(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);

-- ============================================================================
-- RPC Functions
-- ============================================================================

-- Increment community member count
CREATE OR REPLACE FUNCTION increment_community_members(community_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE communities
  SET member_count = member_count + 1,
      updated_at = NOW()
  WHERE id = community_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement community member count
CREATE OR REPLACE FUNCTION decrement_community_members(community_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE communities
  SET member_count = GREATEST(0, member_count - 1),
      updated_at = NOW()
  WHERE id = community_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment post likes
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE community_posts
  SET likes = likes + 1,
      updated_at = NOW()
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update community activity level based on recent posts
CREATE OR REPLACE FUNCTION update_community_activity_level(community_id UUID)
RETURNS VOID AS $$
DECLARE
  recent_post_count INTEGER;
  new_activity_level VARCHAR(20);
BEGIN
  -- Count posts in last 30 days
  SELECT COUNT(*)
  INTO recent_post_count
  FROM community_posts
  WHERE community_posts.community_id = update_community_activity_level.community_id
    AND created_at >= NOW() - INTERVAL '30 days';

  -- Determine activity level
  IF recent_post_count > 20 THEN
    new_activity_level := 'high';
  ELSIF recent_post_count > 5 THEN
    new_activity_level := 'medium';
  ELSE
    new_activity_level := 'low';
  END IF;

  -- Update community
  UPDATE communities
  SET activity_level = new_activity_level,
      updated_at = NOW()
  WHERE id = community_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- Communities: Everyone can view
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Communities are viewable by everyone'
      AND schemaname = 'public'
      AND tablename = 'communities'
  ) THEN
    CREATE POLICY "Communities are viewable by everyone"
      ON communities FOR SELECT
      USING (true);
  END IF;
END $$;

-- Communities: Authenticated users can create
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Authenticated users can create communities'
      AND schemaname = 'public'
      AND tablename = 'communities'
  ) THEN
    CREATE POLICY "Authenticated users can create communities"
      ON communities FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Communities: Admins and moderators can update
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Community admins can update communities'
      AND schemaname = 'public'
      AND tablename = 'communities'
  ) THEN
    CREATE POLICY "Community admins can update communities"
      ON communities FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM community_members
          WHERE community_members.community_id = communities.id
            AND community_members.user_id = auth.uid()
            AND community_members.role IN ('admin', 'moderator')
        )
      );
  END IF;
END $$;

-- Community Members: Everyone can view
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Community members are viewable by everyone'
      AND schemaname = 'public'
      AND tablename = 'community_members'
  ) THEN
    CREATE POLICY "Community members are viewable by everyone"
      ON community_members FOR SELECT
      USING (true);
  END IF;
END $$;

-- Community Members: Users can join communities
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can join communities'
      AND schemaname = 'public'
      AND tablename = 'community_members'
  ) THEN
    CREATE POLICY "Users can join communities"
      ON community_members FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Community Members: Users can leave communities
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can leave communities'
      AND schemaname = 'public'
      AND tablename = 'community_members'
  ) THEN
    CREATE POLICY "Users can leave communities"
      ON community_members FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Community Posts: Everyone can view
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Community posts are viewable by everyone'
      AND schemaname = 'public'
      AND tablename = 'community_posts'
  ) THEN
    CREATE POLICY "Community posts are viewable by everyone"
      ON community_posts FOR SELECT
      USING (true);
  END IF;
END $$;

-- Community Posts: Members can create posts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Community members can create posts'
      AND schemaname = 'public'
      AND tablename = 'community_posts'
  ) THEN
    CREATE POLICY "Community members can create posts"
      ON community_posts FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (
          SELECT 1 FROM community_members
          WHERE community_members.community_id = community_posts.community_id
            AND community_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Community Posts: Authors can update their posts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Authors can update their posts'
      AND schemaname = 'public'
      AND tablename = 'community_posts'
  ) THEN
    CREATE POLICY "Authors can update their posts"
      ON community_posts FOR UPDATE
      TO authenticated
      USING (auth.uid() = author_id);
  END IF;
END $$;

-- Community Posts: Authors can delete their posts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Authors can delete their posts'
      AND schemaname = 'public'
      AND tablename = 'community_posts'
  ) THEN
    CREATE POLICY "Authors can delete their posts"
      ON community_posts FOR DELETE
      TO authenticated
      USING (auth.uid() = author_id);
  END IF;
END $$;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update community activity level when posts are created
CREATE OR REPLACE FUNCTION trigger_update_community_activity()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_community_activity_level(NEW.community_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_community_activity_on_post
  AFTER INSERT ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_community_activity();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_communities_updated_at
  BEFORE UPDATE ON communities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Storage Bucket for Community Images
-- ============================================================================

-- Create storage bucket for community posts
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-posts', 'community-posts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for community posts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Community post images are publicly accessible'
      AND schemaname = 'storage'
      AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Community post images are publicly accessible"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'community-posts');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Authenticated users can upload community post images'
      AND schemaname = 'storage'
      AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated users can upload community post images"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'community-posts');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can update their own community post images'
      AND schemaname = 'storage'
      AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can update their own community post images"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'community-posts' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can delete their own community post images'
      AND schemaname = 'storage'
      AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can delete their own community post images"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'community-posts' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- ============================================================================
-- Sample Data (Optional - for development)
-- ============================================================================

-- Insert sample communities
INSERT INTO communities (name, description, county, sub_county, member_count, activity_level)
VALUES
  ('Nairobi Green Warriors', 'Urban conservation and tree planting in Nairobi', 'Nairobi', 'Westlands', 0, 'medium'),
  ('Kakamega Forest Guardians', 'Protecting and restoring Kakamega Forest', 'Kakamega', NULL, 0, 'high'),
  ('Mombasa Coastal Cleanup', 'Beach cleanups and ocean conservation', 'Mombasa', NULL, 0, 'medium')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE communities IS 'Communities for local climate action groups';
COMMENT ON TABLE community_members IS 'Membership records for communities';
COMMENT ON TABLE community_posts IS 'Posts and updates within communities';
COMMENT ON FUNCTION increment_community_members IS 'Increments member count when user joins';
COMMENT ON FUNCTION decrement_community_members IS 'Decrements member count when user leaves';
COMMENT ON FUNCTION increment_post_likes IS 'Increments like count on a post';
COMMENT ON FUNCTION update_community_activity_level IS 'Updates activity level based on recent posts';

