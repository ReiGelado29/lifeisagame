/*
  # Add XP History and Sleep to Behaviors

  1. New Tables
    - `xp_history`: Track all XP changes with reasons
  
  2. Modified Tables
    - `behaviors`: Add sleep_influence column
    - `behaviors`: Add default_duration_minutes column

  3. Security
    - Enable RLS on xp_history
    - Add policies for authenticated users
*/

-- Create XP history table
CREATE TABLE IF NOT EXISTS xp_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  reason text NOT NULL,
  balance_after integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add columns to behaviors table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'behaviors' AND column_name = 'sleep_influence'
  ) THEN
    ALTER TABLE behaviors ADD COLUMN sleep_influence integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'behaviors' AND column_name = 'default_duration_minutes'
  ) THEN
    ALTER TABLE behaviors ADD COLUMN default_duration_minutes integer DEFAULT 30;
  END IF;
END $$;

-- Enable RLS on xp_history
ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for xp_history
CREATE POLICY "Users can view own XP history"
  ON xp_history FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = xp_history.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can insert own XP history"
  ON xp_history FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM characters WHERE characters.id = xp_history.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Service role can manage XP history"
  ON xp_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);