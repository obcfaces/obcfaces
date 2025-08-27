-- Add new rejection reason types
ALTER TYPE public.rejection_reason_type ADD VALUE 'makeup_not_allowed';
ALTER TYPE public.rejection_reason_type ADD VALUE 'incorrect_pose';
ALTER TYPE public.rejection_reason_type ADD VALUE 'poor_photo_quality';
ALTER TYPE public.rejection_reason_type ADD VALUE 'clothing_not_form_fitting';
ALTER TYPE public.rejection_reason_type ADD VALUE 'filters_not_allowed';