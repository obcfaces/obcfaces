-- Add rejection reason fields to weekly_contest_participants table
ALTER TABLE public.weekly_contest_participants 
ADD COLUMN IF NOT EXISTS rejection_reason_types TEXT[],
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

COMMENT ON COLUMN public.weekly_contest_participants.rejection_reason_types IS 'Array of rejection reason type keys';
COMMENT ON COLUMN public.weekly_contest_participants.rejection_reason IS 'Additional rejection notes from admin';