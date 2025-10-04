-- Delete all participants that are marked as deleted (deleted_at IS NOT NULL)
DELETE FROM public.weekly_contest_participants
WHERE deleted_at IS NOT NULL;