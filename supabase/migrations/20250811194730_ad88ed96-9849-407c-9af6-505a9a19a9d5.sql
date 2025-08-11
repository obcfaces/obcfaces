-- Add state/region column to user profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS state TEXT;