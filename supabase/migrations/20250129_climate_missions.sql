-- Climate Missions System Migration
-- This migration creates tables for the Climate Missions feature

-- Missions table
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  mission_type VARCHAR(50) NOT NULL CHECK (mission_type IN ('tree_planting', 'waste_cleanup', 'water_conservation', 'petition', 'fundraising')),
  organizer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  location_name VARCHAR(200),
  location_coordinates GEOGRAPHY(POINT, 4326),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  target_metric VARCHAR(50),
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  participant_count INTEGER DEFAULT 0,
  green_coin_reward INTEGER DEFAULT 0,
  verification_required BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Mission participations table
CREATE TABLE IF NOT EXISTS mission_participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  contribution_metric VARCHAR(50),
  contribution_value NUMERIC,
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'submitted', 'approved', 'rejected')),
  verified_at TIMESTAMP,
  UNIQUE(mission_id, user_id)
);

-- Verification evidence table (if not exists from other migrations)
CREATE TABLE IF NOT EXISTS verification_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_id UUID NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  evidence_type VARCHAR(20) CHECK (evidence_type IN ('photo', 'video', 'gps', 'document')),
  files JSONB NOT NULL,
  description TEXT,
  gps_coordinates GEOGRAPHY(POINT, 4326),
  submitted_at TIMESTAMP DEFAULT NOW()
);

-- Verification reviews table (if not exists from other migrations)
CREATE TABLE IF NOT EXISTS verification_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evidence_id UUID REFERENCES verification_evidence(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewer_organization VARCHAR(50),
  status VARCHAR(20) CHECK (status IN ('approved', 'rejected', 'needs_more_info')),
  comments TEXT,
  reviewed_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_missions_type ON missions(mission_type);
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
CREATE INDEX IF NOT EXISTS idx_missions_organizer ON missions(organizer_id);
CREATE INDEX IF NOT EXISTS idx_missions_dates ON missions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_missions_location ON missions USING GIST(location_coordinates);
CREATE INDEX IF NOT EXISTS idx_mission_participations_mission ON mission_participations(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_participations_user ON mission_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_evidence_action ON verification_evidence(action_id, action_type);
CREATE INDEX IF NOT EXISTS idx_verification_evidence_user ON verification_evidence(user_id);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_reviews ENABLE ROW LEVEL SECURITY;

-- Missions policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    WHERE p.polname = 'Missions are viewable by everyone' AND c.relname = 'missions'
  ) THEN
    CREATE POLICY "Missions are viewable by everyone"
      ON missions FOR SELECT
      USING (true);
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    WHERE p.polname = 'Users can create missions' AND c.relname = 'missions'
  ) THEN
    CREATE POLICY "Users can create missions"
      ON missions FOR INSERT
      WITH CHECK ((SELECT auth.uid()) = organizer_id);
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    WHERE p.polname = 'Organizers can update their missions' AND c.relname = 'missions'
  ) THEN
    CREATE POLICY "Organizers can update their missions"
      ON missions FOR UPDATE
      USING ((SELECT auth.uid()) = organizer_id);
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    WHERE p.polname = 'Organizers can delete their missions' AND c.relname = 'missions'
  ) THEN
    CREATE POLICY "Organizers can delete their missions"
      ON missions FOR DELETE
      USING ((SELECT auth.uid()) = organizer_id);
  END IF;
END$$;

-- Mission participations policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    WHERE p.polname = 'Users can view their own participations' AND c.relname = 'mission_participations'
  ) THEN
    CREATE POLICY "Users can view their own participations"
      ON mission_participations FOR SELECT
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    WHERE p.polname = 'Organizers can view participations in their missions' AND c.relname = 'mission_participations'
  ) THEN
    CREATE POLICY "Organizers can view participations in their missions"
      ON mission_participations FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM missions
          WHERE missions.id = mission_participations.mission_id
          AND missions.organizer_id = (SELECT auth.uid())
        )
      );
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    WHERE p.polname = 'Users can join missions' AND c.relname = 'mission_participations'
  ) THEN
    CREATE POLICY "Users can join missions"
      ON mission_participations FOR INSERT
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    WHERE p.polname = 'Users can update their own participations' AND c.relname = 'mission_participations'
  ) THEN
    CREATE POLICY "Users can update their own participations"
      ON mission_participations FOR UPDATE
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END$$;

-- Verification evidence policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    WHERE p.polname = 'Users can view their own evidence' AND c.relname = 'verification_evidence'
  ) THEN
    CREATE POLICY "Users can view their own evidence"
      ON verification_evidence FOR SELECT
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    WHERE p.polname = 'Users can submit evidence' AND c.relname = 'verification_evidence'
  ) THEN
    CREATE POLICY "Users can submit evidence"
      ON verification_evidence FOR INSERT
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END$$;

-- Verification reviews policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    WHERE p.polname = 'Users can view reviews of their evidence' AND c.relname = 'verification_reviews'
  ) THEN
    CREATE POLICY "Users can view reviews of their evidence"
      ON verification_reviews FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM verification_evidence
          WHERE verification_evidence.id = verification_reviews.evidence_id
          AND verification_evidence.user_id = (SELECT auth.uid())
        )
      );
  END IF;
END$$;

-- Function to update mission participant count
CREATE OR REPLACE FUNCTION update_mission_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE missions
    SET participant_count = participant_count + 1
    WHERE id = NEW.mission_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE missions
    SET participant_count = participant_count - 1
    WHERE id = OLD.mission_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update participant count
CREATE TRIGGER mission_participation_count_trigger
AFTER INSERT OR DELETE ON mission_participations
FOR EACH ROW
EXECUTE FUNCTION update_mission_participant_count();

-- Function to update mission updated_at timestamp
CREATE OR REPLACE FUNCTION update_mission_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER mission_updated_at_trigger
BEFORE UPDATE ON missions
FOR EACH ROW
EXECUTE FUNCTION update_mission_timestamp();
