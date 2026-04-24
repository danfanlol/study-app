-- Collections table
CREATE TABLE IF NOT EXISTS flashcard_set_collections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE flashcard_set_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own collections"
  ON flashcard_set_collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections"
  ON flashcard_set_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON flashcard_set_collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON flashcard_set_collections FOR DELETE
  USING (auth.uid() = user_id);

-- Junction table linking collections to flashcard sets
CREATE TABLE IF NOT EXISTS flashcard_set_collection_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id uuid REFERENCES flashcard_set_collections(id) ON DELETE CASCADE NOT NULL,
  set_id uuid REFERENCES flashcard_sets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(collection_id, set_id)
);

ALTER TABLE flashcard_set_collection_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own collection members"
  ON flashcard_set_collection_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own collections"
  ON flashcard_set_collection_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own collections"
  ON flashcard_set_collection_members FOR DELETE
  USING (auth.uid() = user_id);
