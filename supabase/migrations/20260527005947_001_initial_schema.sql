/*
  # Life RPG Database Schema

  1. New Tables
    - `characters`: Main character profile (name, weight, class, xp)
    - `attribute_categories`: Categories for attributes (Physical, Psychological, Knowledge)
    - `attributes`: Individual attributes within categories
    - `character_attributes`: Character-specific attribute values
    - `behaviors`: Activities/events that affect mental stats
    - `daily_logs`: Daily progress tracking
    - `daily_activities`: Activities performed each day
    - `missions`: Main missions/objectives
    - `mission_steps`: Steps within missions (supports nesting up to 4 levels)
    - `inventory_items`: Character's physical items
    - `notepad_notes`: Notepad entries

  2. Security
    - RLS enabled on all tables
    - Policies restrict access to authenticated users' own data
*/

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL DEFAULT 'Adventurer',
  weight numeric DEFAULT 70,
  class text DEFAULT 'Novice',
  xp integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Attribute categories
CREATE TABLE IF NOT EXISTS attribute_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Attributes
CREATE TABLE IF NOT EXISTS attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES attribute_categories(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  parent_id uuid REFERENCES attributes(id) ON DELETE CASCADE,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(category_id, name, parent_id)
);

-- Character attribute values
CREATE TABLE IF NOT EXISTS character_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  attribute_id uuid REFERENCES attributes(id) ON DELETE CASCADE NOT NULL,
  value integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(character_id, attribute_id)
);

-- Behaviors/Activities that affect stats
CREATE TABLE IF NOT EXISTS behaviors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  mental_energy integer DEFAULT 0,
  stable_dopamine integer DEFAULT 0,
  focus integer DEFAULT 0,
  stress integer DEFAULT 0,
  emotional_stability integer DEFAULT 0,
  fatigue integer DEFAULT 0,
  cognitive_overload integer DEFAULT 0,
  xp_reward integer DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Daily logs
CREATE TABLE IF NOT EXISTS daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  mental_energy integer DEFAULT 50,
  stable_dopamine integer DEFAULT 50,
  focus integer DEFAULT 50,
  stress integer DEFAULT 30,
  emotional_stability integer DEFAULT 50,
  fatigue integer DEFAULT 30,
  cognitive_overload integer DEFAULT 30,
  sleep_hours numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(character_id, log_date)
);

-- Daily activities
CREATE TABLE IF NOT EXISTS daily_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id uuid REFERENCES daily_logs(id) ON DELETE CASCADE NOT NULL,
  behavior_id uuid REFERENCES behaviors(id) ON DELETE CASCADE NOT NULL,
  duration_minutes integer DEFAULT 0,
  notes text,
  performed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Missions
CREATE TABLE IF NOT EXISTS missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  xp_reward integer DEFAULT 0,
  deadline timestamptz,
  urgency text CHECK(urgency IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  status text CHECK(status IN ('active', 'completed', 'failed', 'paused')) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Mission steps (supports 4 levels of nesting)
CREATE TABLE IF NOT EXISTS mission_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid REFERENCES missions(id) ON DELETE CASCADE NOT NULL,
  parent_step_id uuid REFERENCES mission_steps(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  xp_reward integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  display_order integer DEFAULT 0,
  level integer DEFAULT 0 CHECK(level >= 0 AND level <= 3),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Mission step attribute rewards
CREATE TABLE IF NOT EXISTS mission_step_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_step_id uuid REFERENCES mission_steps(id) ON DELETE CASCADE NOT NULL,
  attribute_id uuid REFERENCES attributes(id) ON DELETE CASCADE NOT NULL,
  xp_amount integer DEFAULT 0,
  UNIQUE(mission_step_id, attribute_id)
);

-- Inventory items
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  category text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Item objectives
CREATE TABLE IF NOT EXISTS item_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id uuid REFERENCES inventory_items(id) ON DELETE CASCADE NOT NULL,
  objective text NOT NULL,
  is_completed boolean DEFAULT false,
  frequency text,
  created_at timestamptz DEFAULT now()
);

-- Item information
CREATE TABLE IF NOT EXISTS item_information (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id uuid REFERENCES inventory_items(id) ON DELETE CASCADE NOT NULL,
  information text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Notepad notes
CREATE TABLE IF NOT EXISTS notepad_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  title text,
  content text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE behaviors ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_step_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE notepad_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for characters
CREATE POLICY "Users can read own character"
  ON characters FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own character"
  ON characters FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own character"
  ON characters FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own character"
  ON characters FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for attribute_categories (public read)
CREATE POLICY "Authenticated users can read attribute categories"
  ON attribute_categories FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for attributes (public read)
CREATE POLICY "Authenticated users can read attributes"
  ON attributes FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for character_attributes
CREATE POLICY "Users can read own character attributes"
  ON character_attributes FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = character_attributes.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can insert own character attributes"
  ON character_attributes FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM characters WHERE characters.id = character_attributes.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can update own character attributes"
  ON character_attributes FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = character_attributes.character_id AND characters.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM characters WHERE characters.id = character_attributes.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can delete own character attributes"
  ON character_attributes FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = character_attributes.character_id AND characters.user_id = auth.uid()));

-- RLS Policies for behaviors (public read)
CREATE POLICY "Authenticated users can read behaviors"
  ON behaviors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage behaviors"
  ON behaviors FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for daily_logs
CREATE POLICY "Users can read own daily logs"
  ON daily_logs FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = daily_logs.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can insert own daily logs"
  ON daily_logs FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM characters WHERE characters.id = daily_logs.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can update own daily logs"
  ON daily_logs FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = daily_logs.character_id AND characters.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM characters WHERE characters.id = daily_logs.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can delete own daily logs"
  ON daily_logs FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = daily_logs.character_id AND characters.user_id = auth.uid()));

-- Similar policies for daily_activities
CREATE POLICY "Users can read own daily activities"
  ON daily_activities FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM daily_logs WHERE daily_logs.id = daily_activities.daily_log_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = daily_logs.character_id AND characters.user_id = auth.uid())));

CREATE POLICY "Users can insert own daily activities"
  ON daily_activities FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM daily_logs WHERE daily_logs.id = daily_activities.daily_log_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = daily_logs.character_id AND characters.user_id = auth.uid())));

CREATE POLICY "Users can update own daily activities"
  ON daily_activities FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM daily_logs WHERE daily_logs.id = daily_activities.daily_log_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = daily_logs.character_id AND characters.user_id = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM daily_logs WHERE daily_logs.id = daily_activities.daily_log_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = daily_logs.character_id AND characters.user_id = auth.uid())));

CREATE POLICY "Users can delete own daily activities"
  ON daily_activities FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM daily_logs WHERE daily_logs.id = daily_activities.daily_log_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = daily_logs.character_id AND characters.user_id = auth.uid())));

-- RLS Policies for missions and related tables
CREATE POLICY "Users can read own missions"
  ON missions FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = missions.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can insert own missions"
  ON missions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM characters WHERE characters.id = missions.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can update own missions"
  ON missions FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = missions.character_id AND characters.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM characters WHERE characters.id = missions.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can delete own missions"
  ON missions FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = missions.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can read own mission steps"
  ON mission_steps FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM missions WHERE missions.id = mission_steps.mission_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = missions.character_id AND characters.user_id = auth.uid())));

CREATE POLICY "Users can insert own mission steps"
  ON mission_steps FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM missions WHERE missions.id = mission_steps.mission_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = missions.character_id AND characters.user_id = auth.uid())));

CREATE POLICY "Users can update own mission steps"
  ON mission_steps FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM missions WHERE missions.id = mission_steps.mission_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = missions.character_id AND characters.user_id = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM missions WHERE missions.id = mission_steps.mission_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = missions.character_id AND characters.user_id = auth.uid())));

CREATE POLICY "Users can delete own mission steps"
  ON mission_steps FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM missions WHERE missions.id = mission_steps.mission_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = missions.character_id AND characters.user_id = auth.uid())));

CREATE POLICY "Users can read own mission step attributes"
  ON mission_step_attributes FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM mission_steps WHERE mission_steps.id = mission_step_attributes.mission_step_id AND EXISTS (SELECT 1 FROM missions WHERE missions.id = mission_steps.mission_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = missions.character_id AND characters.user_id = auth.uid()))));

CREATE POLICY "Users can insert own mission step attributes"
  ON mission_step_attributes FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM mission_steps WHERE mission_steps.id = mission_step_attributes.mission_step_id AND EXISTS (SELECT 1 FROM missions WHERE missions.id = mission_steps.mission_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = missions.character_id AND characters.user_id = auth.uid()))));

CREATE POLICY "Users can update own mission step attributes"
  ON mission_step_attributes FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM mission_steps WHERE mission_steps.id = mission_step_attributes.mission_step_id AND EXISTS (SELECT 1 FROM missions WHERE missions.id = mission_steps.mission_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = missions.character_id AND characters.user_id = auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM mission_steps WHERE mission_steps.id = mission_step_attributes.mission_step_id AND EXISTS (SELECT 1 FROM missions WHERE missions.id = mission_steps.mission_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = missions.character_id AND characters.user_id = auth.uid()))));

CREATE POLICY "Users can delete own mission step attributes"
  ON mission_step_attributes FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM mission_steps WHERE mission_steps.id = mission_step_attributes.mission_step_id AND EXISTS (SELECT 1 FROM missions WHERE missions.id = mission_steps.mission_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = missions.character_id AND characters.user_id = auth.uid()))));

-- RLS Policies for inventory and related tables
CREATE POLICY "Users can read own inventory items"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = inventory_items.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can insert own inventory items"
  ON inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM characters WHERE characters.id = inventory_items.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can update own inventory items"
  ON inventory_items FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = inventory_items.character_id AND characters.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM characters WHERE characters.id = inventory_items.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can delete own inventory items"
  ON inventory_items FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = inventory_items.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can read own item objectives"
  ON item_objectives FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM inventory_items WHERE inventory_items.id = item_objectives.inventory_item_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = inventory_items.character_id AND characters.user_id = auth.uid())));

CREATE POLICY "Users can insert own item objectives"
  ON item_objectives FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM inventory_items WHERE inventory_items.id = item_objectives.inventory_item_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = inventory_items.character_id AND characters.user_id = auth.uid())));

CREATE POLICY "Users can update own item objectives"
  ON item_objectives FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM inventory_items WHERE inventory_items.id = item_objectives.inventory_item_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = inventory_items.character_id AND characters.user_id = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM inventory_items WHERE inventory_items.id = item_objectives.inventory_item_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = inventory_items.character_id AND characters.user_id = auth.uid())));

CREATE POLICY "Users can delete own item objectives"
  ON item_objectives FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM inventory_items WHERE inventory_items.id = item_objectives.inventory_item_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = inventory_items.character_id AND characters.user_id = auth.uid())));

CREATE POLICY "Users can read own item information"
  ON item_information FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM inventory_items WHERE inventory_items.id = item_information.inventory_item_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = inventory_items.character_id AND characters.user_id = auth.uid())));

CREATE POLICY "Users can insert own item information"
  ON item_information FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM inventory_items WHERE inventory_items.id = item_information.inventory_item_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = inventory_items.character_id AND characters.user_id = auth.uid())));

CREATE POLICY "Users can update own item information"
  ON item_information FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM inventory_items WHERE inventory_items.id = item_information.inventory_item_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = inventory_items.character_id AND characters.user_id = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM inventory_items WHERE inventory_items.id = item_information.inventory_item_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = inventory_items.character_id AND characters.user_id = auth.uid())));

CREATE POLICY "Users can delete own item information"
  ON item_information FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM inventory_items WHERE inventory_items.id = item_information.inventory_item_id AND EXISTS (SELECT 1 FROM characters WHERE characters.id = inventory_items.character_id AND characters.user_id = auth.uid())));

-- RLS Policies for notepad_notes
CREATE POLICY "Users can read own notes"
  ON notepad_notes FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = notepad_notes.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can insert own notes"
  ON notepad_notes FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM characters WHERE characters.id = notepad_notes.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can update own notes"
  ON notepad_notes FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = notepad_notes.character_id AND characters.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM characters WHERE characters.id = notepad_notes.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can delete own notes"
  ON notepad_notes FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = notepad_notes.character_id AND characters.user_id = auth.uid()));