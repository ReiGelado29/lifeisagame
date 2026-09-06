```sql
/*
  # User-owned Attribute Categories and Attributes

  1. Changes
    - Add user_id to attribute_categories
    - Add user_id to attributes
    - Add updated_at to both tables
    - Remove old shared-data RLS policies
    - Add user-scoped RLS policies
    - Change category name uniqueness from global to per-user
    - Change attribute uniqueness to be scoped by user/category/parent

  2. Important
    - Existing attribute/category data is intentionally discarded.
    - The application is not in production yet, so this migration starts
      the category/attribute system with a clean state.

  3. Security
    - Users can only read, create, update and delete their own categories.
    - Users can only read, create, update and delete their own attributes.
    - Attributes can only reference categories belonging to the same user.
    - Parent attributes must also belong to the same user.
*/

-- ============================================================
-- 1. Remove existing character attribute values
-- ============================================================
-- Attributes/categories are being recreated as user-owned data.
-- Existing character_attributes reference the old shared attributes.

DELETE FROM character_attributes;


-- ============================================================
-- 2. Remove existing attributes and categories
-- ============================================================
DELETE FROM attributes;
DELETE FROM attribute_categories;


-- ============================================================
-- 3. Remove old RLS policies
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can read attribute categories"
  ON attribute_categories;

DROP POLICY IF EXISTS "Authenticated users can update attribute categories"
  ON attribute_categories;

DROP POLICY IF EXISTS "Authenticated users can delete attribute categories"
  ON attribute_categories;

DROP POLICY IF EXISTS "Authenticated users can read attributes"
  ON attributes;

DROP POLICY IF EXISTS "Authenticated users can update attributes"
  ON attributes;

DROP POLICY IF EXISTS "Authenticated users can delete attributes"
  ON attributes;


-- ============================================================
-- 4. Add user_id to attribute_categories
-- ============================================================

ALTER TABLE attribute_categories
  ADD COLUMN IF NOT EXISTS user_id uuid
  REFERENCES auth.users(id)
  ON DELETE CASCADE;


-- ============================================================
-- 5. Add user_id to attributes
-- ============================================================

ALTER TABLE attributes
  ADD COLUMN IF NOT EXISTS user_id uuid
  REFERENCES auth.users(id)
  ON DELETE CASCADE;


-- ============================================================
-- 6. Add updated_at
-- ============================================================

ALTER TABLE attribute_categories
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE attributes
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();


-- ============================================================
-- 7. Make user_id mandatory
-- ============================================================

ALTER TABLE attribute_categories
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE attributes
  ALTER COLUMN user_id SET NOT NULL;


-- ============================================================
-- 8. Remove old global UNIQUE constraints
-- ============================================================

ALTER TABLE attribute_categories
  DROP CONSTRAINT IF EXISTS attribute_categories_name_key;

ALTER TABLE attributes
  DROP CONSTRAINT IF EXISTS attributes_category_id_name_parent_id_key;


-- ============================================================
-- 9. Create user-scoped uniqueness
-- ============================================================

-- A user cannot have two categories with the same name.
CREATE UNIQUE INDEX IF NOT EXISTS
  attribute_categories_user_name_unique
ON attribute_categories (user_id, name);


-- A user cannot have two attributes with the same name
-- inside the same category and parent.
CREATE UNIQUE INDEX IF NOT EXISTS
  attributes_user_category_name_parent_unique
ON attributes (user_id, category_id, name, parent_id);


-- ============================================================
-- 10. Create indexes for user-scoped queries
-- ============================================================

CREATE INDEX IF NOT EXISTS
  attribute_categories_user_id_idx
ON attribute_categories (user_id);

CREATE INDEX IF NOT EXISTS
  attributes_user_id_idx
ON attributes (user_id);

CREATE INDEX IF NOT EXISTS
  attributes_category_id_idx
ON attributes (category_id);

CREATE INDEX IF NOT EXISTS
  attributes_parent_id_idx
ON attributes (parent_id);


-- ============================================================
-- 11. Enable RLS
-- ============================================================

ALTER TABLE attribute_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 12. RLS policies for attribute_categories
-- ============================================================

CREATE POLICY "Users can read own attribute categories"
  ON attribute_categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);


CREATE POLICY "Users can create own attribute categories"
  ON attribute_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);


CREATE POLICY "Users can update own attribute categories"
  ON attribute_categories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


CREATE POLICY "Users can delete own attribute categories"
  ON attribute_categories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================
-- 13. RLS policies for attributes
-- ============================================================

CREATE POLICY "Users can read own attributes"
  ON attributes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);


CREATE POLICY "Users can create own attributes"
  ON attributes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );


CREATE POLICY "Users can update own attributes"
  ON attributes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
  );


CREATE POLICY "Users can delete own attributes"
  ON attributes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================
-- 14. Trigger function for updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ============================================================
-- 15. updated_at triggers
-- ============================================================

DROP TRIGGER IF EXISTS update_attribute_categories_updated_at
  ON attribute_categories;

CREATE TRIGGER update_attribute_categories_updated_at
  BEFORE UPDATE ON attribute_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS update_attributes_updated_at
  ON attributes;

CREATE TRIGGER update_attributes_updated_at
  BEFORE UPDATE ON attributes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```
