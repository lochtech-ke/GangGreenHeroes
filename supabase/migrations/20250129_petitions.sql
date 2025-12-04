-- Petitions and Policy Engagement System
-- Migration for Task 20: Policy Engagement Tools

-- Petitions table
CREATE TABLE IF NOT EXISTS petitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'petitions' 
      AND column_name = 'target_audience'
  ) THEN
    ALTER TABLE petitions ADD COLUMN target_audience VARCHAR(50) NOT NULL DEFAULT 'national' CHECK (target_audience IN ('county', 'national', 'international'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'petitions' 
      AND column_name = 'target_organization'
  ) THEN
    ALTER TABLE petitions ADD COLUMN target_organization VARCHAR(200) NOT NULL DEFAULT 'TBD';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'petitions' 
      AND column_name = 'signature_goal'
  ) THEN
    ALTER TABLE petitions ADD COLUMN signature_goal INTEGER NOT NULL DEFAULT 100 CHECK (signature_goal > 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'petitions' 
      AND column_name = 'current_signatures'
  ) THEN
    ALTER TABLE petitions ADD COLUMN current_signatures INTEGER DEFAULT 0 CHECK (current_signatures >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'petitions' 
      AND column_name = 'deadline'
  ) THEN
    ALTER TABLE petitions ADD COLUMN deadline TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '30 days');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'petitions' 
      AND column_name = 'status'
  ) THEN
    ALTER TABLE petitions ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'successful', 'archived'));
  END IF;
END $$;

-- Add constraint if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'deadline_in_future' 
      AND conrelid = 'public.petitions'::regclass
  ) THEN
    ALTER TABLE petitions ADD CONSTRAINT deadline_in_future CHECK (deadline > created_at);
  END IF;
EXCEPTION
  WHEN others THEN NULL; -- Ignore if constraint already exists
END $$;

-- Petition signatures table
CREATE TABLE IF NOT EXISTS petition_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  petition_id UUID NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signed_at TIMESTAMP DEFAULT NOW(),
  public_display BOOLEAN DEFAULT TRUE,
  comment TEXT,
  UNIQUE (petition_id, user_id)
);

-- Petition updates table (for campaign progress updates)
CREATE TABLE IF NOT EXISTS petition_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  petition_id UUID NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_petitions_status ON petitions(status);
CREATE INDEX IF NOT EXISTS idx_petitions_deadline ON petitions(deadline);
CREATE INDEX IF NOT EXISTS idx_petitions_created_by ON petitions(created_by);
CREATE INDEX IF NOT EXISTS idx_petitions_created_at ON petitions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_petition_signatures_petition ON petition_signatures(petition_id);
CREATE INDEX IF NOT EXISTS idx_petition_signatures_user ON petition_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_petition_updates_petition ON petition_updates(petition_id, created_at DESC);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE petitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE petition_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE petition_updates ENABLE ROW LEVEL SECURITY;

-- Petitions: Anyone can view active petitions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'petitions'
      AND policyname = 'Anyone can view active petitions'
  ) THEN
    CREATE POLICY "Anyone can view active petitions"
      ON petitions FOR SELECT
      USING (status = 'active' OR status = 'successful');
  END IF;
END $$;

-- Petitions: Authenticated users can create petitions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'petitions'
      AND policyname = 'Authenticated users can create petitions'
  ) THEN
    CREATE POLICY "Authenticated users can create petitions"
      ON petitions FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = created_by);
  END IF;
END $$;

-- Petitions: Creators can update their own petitions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'petitions'
      AND policyname = 'Creators can update their own petitions'
  ) THEN
    CREATE POLICY "Creators can update their own petitions"
      ON petitions FOR UPDATE
      TO authenticated
      USING (auth.uid() = created_by);
  END IF;
END $$;

-- Petition Signatures: Anyone can view public signatures
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'petition_signatures'
      AND policyname = 'Anyone can view public signatures'
  ) THEN
    CREATE POLICY "Anyone can view public signatures"
      ON petition_signatures FOR SELECT
      USING (public_display = true);
  END IF;
END $$;

-- Petition Signatures: Users can view their own signatures
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'petition_signatures'
      AND policyname = 'Users can view their own signatures'
  ) THEN
    CREATE POLICY "Users can view their own signatures"
      ON petition_signatures FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Petition Signatures: Authenticated users can sign petitions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'petition_signatures'
      AND policyname = 'Authenticated users can sign petitions'
  ) THEN
    CREATE POLICY "Authenticated users can sign petitions"
      ON petition_signatures FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Petition Signatures: Users can update their own signatures
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'petition_signatures'
      AND policyname = 'Users can update their own signatures'
  ) THEN
    CREATE POLICY "Users can update their own signatures"
      ON petition_signatures FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Petition Updates: Anyone can view updates
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'petition_updates'
      AND policyname = 'Anyone can view petition updates'
  ) THEN
    CREATE POLICY "Anyone can view petition updates"
      ON petition_updates FOR SELECT
      USING (true);
  END IF;
END $$;

-- Petition Updates: Petition creators can add updates
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'petition_updates'
      AND policyname = 'Petition creators can add updates'
  ) THEN
    CREATE POLICY "Petition creators can add updates"
      ON petition_updates FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM petitions
          WHERE petitions.id = petition_id
          AND petitions.created_by = auth.uid()
        )
      );
  END IF;
END $$;

-- Function to update petition signature count
CREATE OR REPLACE FUNCTION update_petition_signature_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE petitions
    SET current_signatures = current_signatures + 1,
        updated_at = NOW()
    WHERE id = NEW.petition_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE petitions
    SET current_signatures = GREATEST(0, current_signatures - 1),
        updated_at = NOW()
    WHERE id = OLD.petition_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update signature count
DROP TRIGGER IF EXISTS trigger_update_petition_signature_count ON petition_signatures;
CREATE TRIGGER trigger_update_petition_signature_count
AFTER INSERT OR DELETE ON petition_signatures
FOR EACH ROW
EXECUTE FUNCTION update_petition_signature_count();

-- Function to auto-close expired petitions
CREATE OR REPLACE FUNCTION close_expired_petitions()
RETURNS void AS $$
BEGIN
  UPDATE petitions
  SET status = 'closed',
      updated_at = NOW()
  WHERE status = 'active'
  AND deadline < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE petitions IS 'Stores environmental policy petitions and advocacy campaigns';
COMMENT ON TABLE petition_signatures IS 'Records user signatures on petitions';
COMMENT ON TABLE petition_updates IS 'Campaign progress updates from petition creators';
COMMENT ON COLUMN petitions.target_audience IS 'Level of government: county, national, or international';
COMMENT ON COLUMN petitions.signature_goal IS 'Target number of signatures needed';
COMMENT ON COLUMN petitions.current_signatures IS 'Current count of signatures (auto-updated by trigger)';
