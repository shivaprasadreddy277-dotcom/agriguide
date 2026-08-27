-- Migration 002: Google OAuth2 & Forgot Password Support

-- Make password_hash nullable for Google-only users
ALTER TABLE app_users ALTER COLUMN password_hash DROP NOT NULL;

-- Add Google ID column for OAuth2 linking
ALTER TABLE app_users ADD COLUMN google_id VARCHAR(255) UNIQUE;

-- Create Password Reset Token lifecycle table
CREATE TABLE password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index token hashes for fast lookup
CREATE INDEX idx_password_resets_token ON password_resets(token_hash);
