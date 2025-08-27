-- Add rejection_reason field to contest_applications table
ALTER TABLE public.contest_applications 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;