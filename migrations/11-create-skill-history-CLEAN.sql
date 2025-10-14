-- Migration: Create skill_history table (CLEAN VERSION)
-- This version drops everything first to avoid conflicts

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view skill history" ON skill_history;
DROP POLICY IF EXISTS "Users can insert skills" ON skill_history;
DROP POLICY IF EXISTS "Users can update skills" ON skill_history;
DROP POLICY IF EXISTS "Users can delete skills" ON skill_history;

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_skill_history_user_id;
DROP INDEX IF EXISTS idx_skill_history_recorded_at;

-- Drop the table if it exists
DROP TABLE IF EXISTS skill_history;

-- Create skill_history table
CREATE TABLE skill_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Melee skills (for EK primarily)
  sword_level INTEGER,
  sword_percent INTEGER CHECK (sword_percent >= 0 AND sword_percent < 100),
  club_level INTEGER,
  club_percent INTEGER CHECK (club_percent >= 0 AND club_percent < 100),
  axe_level INTEGER,
  axe_percent INTEGER CHECK (axe_percent >= 0 AND axe_percent < 100),

  -- Magic level (for all vocations)
  magic_level INTEGER,
  magic_percent INTEGER CHECK (magic_percent >= 0 AND magic_percent < 100),

  -- Distance (for RP)
  distance_level INTEGER,
  distance_percent INTEGER CHECK (distance_percent >= 0 AND distance_percent < 100),

  -- Shielding
  shielding_level INTEGER,
  shielding_percent INTEGER CHECK (shielding_percent >= 0 AND shielding_percent < 100),

  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_skill_history_user_id ON skill_history(user_id);
CREATE INDEX idx_skill_history_recorded_at ON skill_history(recorded_at DESC);

-- Enable RLS
ALTER TABLE skill_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Note: Since we're using a custom users table (not Supabase Auth),
-- we'll allow all authenticated operations for now.

-- Users can view all skill history
CREATE POLICY "Users can view skill history"
  ON skill_history FOR SELECT
  USING (true);

-- Users can insert skill records
CREATE POLICY "Users can insert skills"
  ON skill_history FOR INSERT
  WITH CHECK (true);

-- Users can update skill records
CREATE POLICY "Users can update skills"
  ON skill_history FOR UPDATE
  USING (true);

-- Users can delete skill records
CREATE POLICY "Users can delete skills"
  ON skill_history FOR DELETE
  USING (true);
