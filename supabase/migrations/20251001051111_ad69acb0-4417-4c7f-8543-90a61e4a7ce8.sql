-- Remove old participant_status field to prevent conflicts
-- Only admin_status should be used going forward

ALTER TABLE public.weekly_contest_participants 
DROP COLUMN IF EXISTS participant_status CASCADE;

DROP TYPE IF EXISTS participant_status CASCADE;

-- Add comment to clarify the status field
COMMENT ON COLUMN public.weekly_contest_participants.admin_status IS 
'Participant status managed by admins. Possible values: "this week", "next week on site", "next week", "past". ONLY this field should be used for status management.';