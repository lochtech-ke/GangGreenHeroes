-- Migration: Add Performance Monitoring Tables
-- Description: Creates tables for tracking badge performance metrics and alerts
-- Requirements: 11.1, 11.2, 11.3

-- Create badge_performance_metrics table
CREATE TABLE IF NOT EXISTS badge_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_type VARCHAR(50) NOT NULL,
  duration_ms NUMERIC(10, 2) NOT NULL,
  badge_type VARCHAR(100),
  tier VARCHAR(50),
  size INTEGER,
  device_type VARCHAR(20),
  cache_hit BOOLEAN,
  batch_size INTEGER,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_badge_performance_metrics_type ON badge_performance_metrics(metric_type);
CREATE INDEX idx_badge_performance_metrics_created_at ON badge_performance_metrics(created_at);
CREATE INDEX idx_badge_performance_metrics_badge_type ON badge_performance_metrics(badge_type);
CREATE INDEX idx_badge_performance_metrics_device_type ON badge_performance_metrics(device_type);
CREATE INDEX idx_badge_performance_metrics_cache_hit ON badge_performance_metrics(cache_hit);

-- Create badge_performance_alerts table
CREATE TABLE IF NOT EXISTS badge_performance_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_type VARCHAR(50) NOT NULL,
  threshold NUMERIC(10, 2) NOT NULL,
  current_value NUMERIC(10, 2) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for alerts
CREATE INDEX idx_badge_performance_alerts_type ON badge_performance_alerts(alert_type);
CREATE INDEX idx_badge_performance_alerts_severity ON badge_performance_alerts(severity);
CREATE INDEX idx_badge_performance_alerts_acknowledged ON badge_performance_alerts(acknowledged);
CREATE INDEX idx_badge_performance_alerts_created_at ON badge_performance_alerts(created_at);

-- Create badge_analytics_events table for tracking user interactions
CREATE TABLE IF NOT EXISTS badge_analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  badge_id UUID REFERENCES nft_badges(id),
  badge_type VARCHAR(100),
  tier VARCHAR(50),
  design_type VARCHAR(20), -- 'geometric' or 'classic'
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for analytics events
CREATE INDEX idx_badge_analytics_events_type ON badge_analytics_events(event_type);
CREATE INDEX idx_badge_analytics_events_user_id ON badge_analytics_events(user_id);
CREATE INDEX idx_badge_analytics_events_badge_id ON badge_analytics_events(badge_id);
CREATE INDEX idx_badge_analytics_events_design_type ON badge_analytics_events(design_type);
CREATE INDEX idx_badge_analytics_events_created_at ON badge_analytics_events(created_at);

-- Create migration_monitoring table for tracking migration progress
CREATE TABLE IF NOT EXISTS badge_migration_monitoring (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  migration_id VARCHAR(50) NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'started', 'batch_complete', 'error', 'completed'
  batch_number INTEGER,
  badges_processed INTEGER,
  badges_failed INTEGER,
  error_count INTEGER DEFAULT 0,
  error_rate NUMERIC(5, 2),
  duration_ms NUMERIC(10, 2),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for migration monitoring
CREATE INDEX idx_badge_migration_monitoring_migration_id ON badge_migration_monitoring(migration_id);
CREATE INDEX idx_badge_migration_monitoring_event_type ON badge_migration_monitoring(event_type);
CREATE INDEX idx_badge_migration_monitoring_created_at ON badge_migration_monitoring(created_at);

-- Add RLS policies for performance metrics (admin only)
ALTER TABLE badge_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view performance metrics"
  ON badge_performance_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can insert performance metrics"
  ON badge_performance_metrics
  FOR INSERT
  WITH CHECK (true);

-- Add RLS policies for performance alerts (admin only)
ALTER TABLE badge_performance_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view performance alerts"
  ON badge_performance_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin can update performance alerts"
  ON badge_performance_alerts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can insert performance alerts"
  ON badge_performance_alerts
  FOR INSERT
  WITH CHECK (true);

-- Add RLS policies for analytics events
ALTER TABLE badge_analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics events"
  ON badge_analytics_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all analytics events"
  ON badge_analytics_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can insert analytics events"
  ON badge_analytics_events
  FOR INSERT
  WITH CHECK (true);

-- Add RLS policies for migration monitoring (admin only)
ALTER TABLE badge_migration_monitoring ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view migration monitoring"
  ON badge_migration_monitoring
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can insert migration monitoring"
  ON badge_migration_monitoring
  FOR INSERT
  WITH CHECK (true);

-- Create function to clean up old metrics
CREATE OR REPLACE FUNCTION cleanup_old_performance_metrics(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM badge_performance_metrics
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get performance summary
CREATE OR REPLACE FUNCTION get_performance_summary(hours_back INTEGER DEFAULT 24)
RETURNS TABLE (
  metric_type VARCHAR,
  count BIGINT,
  avg_duration NUMERIC,
  p50_duration NUMERIC,
  p95_duration NUMERIC,
  p99_duration NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bpm.metric_type,
    COUNT(*) as count,
    ROUND(AVG(bpm.duration_ms)::NUMERIC, 2) as avg_duration,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY bpm.duration_ms)::NUMERIC, 2) as p50_duration,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY bpm.duration_ms)::NUMERIC, 2) as p95_duration,
    ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY bpm.duration_ms)::NUMERIC, 2) as p99_duration
  FROM badge_performance_metrics bpm
  WHERE bpm.created_at >= NOW() - (hours_back || ' hours')::INTERVAL
  GROUP BY bpm.metric_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE badge_performance_metrics IS 'Stores performance metrics for badge operations';
COMMENT ON TABLE badge_performance_alerts IS 'Stores performance alerts when thresholds are exceeded';
COMMENT ON TABLE badge_analytics_events IS 'Tracks user interactions with badges for analytics';
COMMENT ON TABLE badge_migration_monitoring IS 'Monitors badge migration progress and errors';
COMMENT ON FUNCTION cleanup_old_performance_metrics IS 'Removes performance metrics older than specified days';
COMMENT ON FUNCTION get_performance_summary IS 'Returns performance summary statistics for specified time period';
