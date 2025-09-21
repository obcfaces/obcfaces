-- Add missing timestamp columns to contest_applications table
ALTER TABLE public.contest_applications 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;