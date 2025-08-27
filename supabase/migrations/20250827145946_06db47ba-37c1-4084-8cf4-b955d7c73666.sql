-- Add rejection reason enum and update contest_applications table
CREATE TYPE public.rejection_reason_type AS ENUM (
  'inappropriate_photos',
  'incomplete_information',
  'age_requirements',
  'duplicate_application',
  'quality_standards',
  'terms_violation',
  'other'
);

-- Add rejection_reason column to contest_applications if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contest_applications' 
    AND column_name = 'rejection_reason_type'
  ) THEN
    ALTER TABLE public.contest_applications 
    ADD COLUMN rejection_reason_type rejection_reason_type;
  END IF;
END $$;