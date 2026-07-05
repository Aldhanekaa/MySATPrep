-- Migration 006: Make saved_collections.collection_id unique per user, not globally
--
-- The original schema had `collection_id VARCHAR(255) UNIQUE NOT NULL`, which
-- enforces a *global* unique constraint. This means:
--   1. Two users with the same client-generated collection_id clash.
--   2. During migrate/sync, ON CONFLICT (collection_id) could silently skip or
--      overwrite another user's collection.
--
-- The fix drops the global unique index and creates a composite unique index
-- on (user_id, collection_id) so collection IDs only need to be unique per user.

-- Drop the old global unique constraint on collection_id
ALTER TABLE saved_collections DROP CONSTRAINT IF EXISTS saved_collections_collection_id_key;

-- Also drop the index if it exists under a different name
DROP INDEX IF EXISTS saved_collections_collection_id_key;
DROP INDEX IF EXISTS idx_saved_collections_collection_id;

-- Create a composite unique constraint: unique collection_id per user
ALTER TABLE saved_collections
  ADD CONSTRAINT saved_collections_user_id_collection_id_key
  UNIQUE (user_id, collection_id);

-- Re-create the index for fast lookup by collection_id alone (for UPDATE/DELETE by id)
CREATE INDEX IF NOT EXISTS idx_saved_collections_collection_id
  ON saved_collections(collection_id);
