-- Drop the existing enum type and recreate it with new values
DROP TYPE IF EXISTS public.rejection_reason_type CASCADE;

-- Create the new enum with photo-specific rejection reasons
CREATE TYPE public.rejection_reason_type AS ENUM (
  'first_photo_makeup',
  'first_photo_id_style', 
  'first_photo_blurry',
  'first_photo_filters',
  'second_photo_makeup',
  'second_photo_pose',
  'second_photo_clothing',
  'second_photo_accessories',
  'both_photos_quality'
);

-- Add the rejection_reason_type column back to contest_applications table
ALTER TABLE public.contest_applications 
ADD COLUMN IF NOT EXISTS rejection_reason_type rejection_reason_type;

-- Update any existing rejection reasons to a default value (you may want to map these manually)
UPDATE public.contest_applications 
SET rejection_reason_type = 'both_photos_quality' 
WHERE rejection_reason_type IS NULL AND status = 'rejected';