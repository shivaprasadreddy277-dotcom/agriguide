CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  preferred_language VARCHAR(10) NOT NULL DEFAULT 'en'
    CHECK (preferred_language IN ('en', 'hi')),
  unit_system VARCHAR(10) NOT NULL DEFAULT 'metric'
    CHECK (unit_system IN ('metric', 'imperial')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  ip_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id
  ON user_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at
  ON user_sessions(expires_at);

CREATE TABLE IF NOT EXISTS farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  country VARCHAR(100) NOT NULL,
  state_province VARCHAR(120),
  district_county VARCHAR(120),
  locality VARCHAR(160),
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  total_area NUMERIC(14,4) CHECK (total_area IS NULL OR total_area > 0),
  area_unit VARCHAR(20) NOT NULL DEFAULT 'hectare'
    CHECK (area_unit IN ('hectare', 'acre', 'square_meter', 'square_feet')),
  soil_type VARCHAR(100),
  irrigation_availability VARCHAR(30)
    CHECK (irrigation_availability IN ('none', 'rainfed', 'partial', 'reliable')),
  water_source VARCHAR(100),
  notes TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farms_user_id
  ON farms(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_default_farm_per_user
  ON farms(user_id)
  WHERE is_default = TRUE;

CREATE TABLE IF NOT EXISTS fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  area NUMERIC(14,4) CHECK (area IS NULL OR area > 0),
  area_unit VARCHAR(20) NOT NULL DEFAULT 'hectare'
    CHECK (area_unit IN ('hectare', 'acre', 'square_meter', 'square_feet')),
  soil_type VARCHAR(100),
  irrigation_method VARCHAR(100),
  water_source VARCHAR(100),
  current_crop VARCHAR(160),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fields_farm_id
  ON fields(farm_id);

CREATE TABLE IF NOT EXISTS advisory_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES farms(id) ON DELETE SET NULL,
  field_id UUID REFERENCES fields(id) ON DELETE SET NULL,
  category VARCHAR(40) NOT NULL
    CHECK (category IN (
      'crop_selection',
      'land_preparation',
      'seed_selection',
      'sowing_planting',
      'irrigation',
      'soil_nutrition',
      'pest_disease',
      'weed_management',
      'weather_stress',
      'growth_stage',
      'harvest',
      'post_harvest',
      'general'
    )),
  crop_name VARCHAR(160) NOT NULL,
  crop_variety VARCHAR(160),
  growth_stage VARCHAR(40) NOT NULL,
  question TEXT NOT NULL,
  input_snapshot JSONB NOT NULL,
  image_count INTEGER NOT NULL DEFAULT 0
    CHECK (image_count >= 0 AND image_count <= 3),
  preferred_language VARCHAR(10) NOT NULL DEFAULT 'en'
    CHECK (preferred_language IN ('en', 'hi')),
  detail_level VARCHAR(20) NOT NULL DEFAULT 'standard'
    CHECK (detail_level IN ('quick', 'standard', 'detailed')),
  status VARCHAR(20) NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'generating', 'completed', 'failed')),
  error_code VARCHAR(80),
  error_message TEXT,
  generation_attempts INTEGER NOT NULL DEFAULT 0
    CHECK (generation_attempts >= 0),
  idempotency_key VARCHAR(160),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_advisory_requests_user_created
  ON advisory_requests(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_advisory_requests_user_status
  ON advisory_requests(user_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_advisory_requests_idempotency
  ON advisory_requests(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS advisory_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE REFERENCES advisory_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  report_json JSONB NOT NULL,
  model_name VARCHAR(120) NOT NULL,
  prompt_version VARCHAR(40) NOT NULL,
  input_hash VARCHAR(128) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advisory_reports_user_created
  ON advisory_reports(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS advisory_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL UNIQUE REFERENCES advisory_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  helpful BOOLEAN NOT NULL,
  rating INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  comment VARCHAR(2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  event_type VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80),
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_user_created
  ON audit_events(user_id, created_at DESC);

-- Triggers for auto-updating updated_at
CREATE OR REPLACE TRIGGER app_users_updated_at
BEFORE UPDATE ON app_users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER farms_updated_at
BEFORE UPDATE ON farms
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER fields_updated_at
BEFORE UPDATE ON fields
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER advisory_requests_updated_at
BEFORE UPDATE ON advisory_requests
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER advisory_feedback_updated_at
BEFORE UPDATE ON advisory_feedback
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enable Row Level Security
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users FORCE ROW LEVEL SECURITY;

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions FORCE ROW LEVEL SECURITY;

ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms FORCE ROW LEVEL SECURITY;

ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields FORCE ROW LEVEL SECURITY;

ALTER TABLE advisory_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisory_requests FORCE ROW LEVEL SECURITY;

ALTER TABLE advisory_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisory_reports FORCE ROW LEVEL SECURITY;

ALTER TABLE advisory_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisory_feedback FORCE ROW LEVEL SECURITY;

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events FORCE ROW LEVEL SECURITY;

-- Helper function to fetch user ID set inside transaction
CREATE OR REPLACE FUNCTION current_app_user_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::UUID;
$$ LANGUAGE SQL STABLE;

-- RLS Policies
CREATE POLICY app_users_self_access
ON app_users
FOR ALL
USING (id = current_app_user_id())
WITH CHECK (id = current_app_user_id());

CREATE POLICY farms_owner_access
ON farms
FOR ALL
USING (user_id = current_app_user_id())
WITH CHECK (user_id = current_app_user_id());

CREATE POLICY fields_owner_access
ON fields
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM farms
    WHERE farms.id = fields.farm_id
      AND farms.user_id = current_app_user_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM farms
    WHERE farms.id = fields.farm_id
      AND farms.user_id = current_app_user_id()
  )
);

CREATE POLICY advisory_requests_owner_access
ON advisory_requests
FOR ALL
USING (user_id = current_app_user_id())
WITH CHECK (user_id = current_app_user_id());

CREATE POLICY advisory_reports_owner_access
ON advisory_reports
FOR ALL
USING (user_id = current_app_user_id())
WITH CHECK (user_id = current_app_user_id());

CREATE POLICY advisory_feedback_owner_access
ON advisory_feedback
FOR ALL
USING (user_id = current_app_user_id())
WITH CHECK (user_id = current_app_user_id());

CREATE POLICY user_sessions_owner_access
ON user_sessions
FOR ALL
USING (user_id = current_app_user_id())
WITH CHECK (user_id = current_app_user_id());

CREATE POLICY audit_events_read_own
ON audit_events
FOR SELECT
USING (user_id = current_app_user_id());
