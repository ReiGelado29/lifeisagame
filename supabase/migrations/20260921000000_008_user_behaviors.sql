-- Add ownership to behaviors
ALTER TABLE behaviors
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Assign existing behaviors to the only existing user
UPDATE behaviors
SET user_id = (
  SELECT id
  FROM auth.users
  LIMIT 1
)
WHERE user_id IS NULL;

-- Make ownership mandatory from now on
ALTER TABLE behaviors
ALTER COLUMN user_id SET NOT NULL;

-- Remove old behavior policies
DROP POLICY IF EXISTS "Authenticated users can read behaviors" ON behaviors;
DROP POLICY IF EXISTS "Service role can manage behaviors" ON behaviors;

-- Users can only read their own behaviors
CREATE POLICY "Users can read own behaviors"
  ON behaviors FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own behaviors
CREATE POLICY "Users can create own behaviors"
  ON behaviors FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own behaviors
CREATE POLICY "Users can update own behaviors"
  ON behaviors FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own behaviors
CREATE POLICY "Users can delete own behaviors"
  ON behaviors FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can manage all behaviors
CREATE POLICY "Service role can manage behaviors"
  ON behaviors FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
