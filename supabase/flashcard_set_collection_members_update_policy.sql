-- Missing UPDATE policy that allows saving reordered sort_order values
CREATE POLICY "Users can update their own collection members"
  ON flashcard_set_collection_members FOR UPDATE
  USING (auth.uid() = user_id);
