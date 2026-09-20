-- Allow authenticated users to delete their own XP history entries

CREATE POLICY "Users can delete own XP history"
  ON xp_history FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM characters
      WHERE characters.id = xp_history.character_id
        AND characters.user_id = auth.uid()
    )
  );
