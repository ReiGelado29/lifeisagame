/*
  # Fix Missing RLS Policies for Attributes and Categories

  1. Security - Missing Policies
    - ADD UPDATE policy for attributes (allow all authenticated users - attributes are shared data)
    - ADD DELETE policy for attributes (allow all authenticated users - attributes are shared data)
    - ADD UPDATE policy for attribute_categories (allow all authenticated users - categories are shared data)
    - ADD DELETE policy for attribute_categories (allow all authenticated users - categories are shared data)

  Problem: Attributes table only had SELECT policy, blocking UPDATE and DELETE operations
  Solution: Add UPDATE and DELETE policies for authenticated users since attributes/categories are system-wide shared data
*/

CREATE POLICY "Authenticated users can update attributes"
  ON attributes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete attributes"
  ON attributes FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update attribute categories"
  ON attribute_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete attribute categories"
  ON attribute_categories FOR DELETE
  TO authenticated
  USING (true);
