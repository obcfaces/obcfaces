-- Remove duplicate ratings, keeping only the most recent one for each user-participant pair
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, participant_id 
           ORDER BY created_at DESC, updated_at DESC
         ) as rn
  FROM contestant_ratings
)
DELETE FROM contestant_ratings
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Log the cleanup
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % duplicate rating records', deleted_count;
END $$;