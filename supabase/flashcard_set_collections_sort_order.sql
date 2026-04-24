-- Add sort_order to collection members for user-defined ordering
ALTER TABLE flashcard_set_collection_members
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
